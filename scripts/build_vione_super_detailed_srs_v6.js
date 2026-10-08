const fs = require('fs');
const path = require('path');
const docx = require('docx');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel, AlignmentType } = docx;

const rootDir = path.resolve(__dirname, '..');
const docDir = path.join(rootDir, 'document');
const publicDocsDir = path.join(rootDir, 'apps', 'vione_app_fe', 'public', 'docs');

console.log('>>> [SRS VIONE SUPER MASTER 6.0] Bat dau bien soan SRS IEEE 830 MECE toan dien khong bo sot...');

// Danh sách các Module phân rã MECE toàn diện (33 Module: 21 Web CRM + 12 Mobile App)
const srsModules = [
  // --- PHAN I: HE THONG QUAN TRI DOANH NGHIEP VIONE CRM (WEB PORTAL) ---
  {
    moduleNumber: '01',
    moduleName: 'Xác Thực, Đăng Nhập & Quản Lý Phiên C-Level',
    epic: 'Quản trị danh tính và phiên truy cập bảo mật đa kênh trên Web CRM',
    features: [
      {
        id: 'FR-01.01',
        name: 'Đăng nhập Quản trị Đa phương thức (Email, SĐT, Google, Apple OAuth)',
        actor: 'Admin, Ban Giám Đốc, Kế toán, Quản lý chi nhánh, Nhân viên',
        input: 'Identifier (Email hoặc Số điện thoại 9-12 chữ số), Mật khẩu (tối thiểu 8 ký tự), hoặc OAuth Authorization Code, reCAPTCHA v3 token.',
        logic: '1. Hệ thống tiếp nhận payload và chuẩn hóa định dạng (lowercase email, chuẩn hóa SĐT +84).\n2. Kiểm tra Rate Limiting (tối đa 5 lần thử sai trong 15 phút trên 1 địa chỉ IP).\n3. Kiểm tra người dùng trong CSDL PostgreSQL qua NestJS AuthService, đối soát mật khẩu đã băm bcrypt.\n4. Khởi tạo cặp JWT token: Access Token (HS256, hạn 60 phút) và Refresh Token (hạn 30 ngày) lưu phiên an toàn.\n5. Trả về thông tin hồ sơ tài khoản (User Profile, vai trò RBAC, danh sách quyền) và thiết lập HttpOnly cookie nếu trên môi trường HTTPS.',
        output: 'JSON chứa access_token, refresh_token, thông tin user và chuyển hướng vào /dashboard.',
        exception: 'Tài khoản không tồn tại hoặc sai mật khẩu: Báo lỗi mã 401 "Thông tin đăng nhập không chính xác". Khóa tài khoản sau 5 lần nhập sai.',
        api: 'POST /api/auth/login'
      },
      {
        id: 'FR-01.02',
        name: 'Xác thực Đăng nhập Hai Lớp (MFA) & Cấp lại Mật khẩu OTP',
        actor: 'Toàn bộ người dùng hệ thống',
        input: 'Email hoặc Số điện thoại đã đăng ký, mã OTP 6 chữ số.',
        logic: '1. Người dùng gửi yêu cầu quên mật khẩu hoặc kích hoạt MFA.\n2. Hệ thống sinh mã OTP 6 số ngẫu nhiên với thời gian sống TTL 5 phút, lưu cache Redis.\n3. Gửi OTP qua cổng SMS Viettel/FPT hoặc Email SMTP doanh nghiệp.\n4. Người dùng nhập mã OTP để xác thực, nếu đúng cho phép nhập mật khẩu mới và hủy toàn bộ phiên cũ.',
        output: 'Mã OTP gửi đến thiết bị; sau xác thực thành công cho phép đặt lại mật khẩu mới.',
        exception: 'Mã OTP quá hạn (sau 5 phút) hoặc nhập sai quá 3 lần: Yêu cầu tạo mã OTP mới.',
        api: 'POST /api/auth/forgot-password, POST /api/auth/verify-otp'
      }
    ]
  },
  {
    moduleNumber: '02',
    moduleName: 'Bảng Điều Hành Số C-Level (Executive Dashboard)',
    epic: 'Tổng hợp chỉ số KPI, dòng tiền, hiệu suất bán hàng và cảnh báo điều hành',
    features: [
      {
        id: 'FR-02.01',
        name: 'Tổng hợp Chỉ số Điều hành Thời Gian Thực (KPI Metric Cards)',
        actor: 'CEO, COO, CFO, Quản trị hệ thống',
        input: 'Bộ lọc thời gian (Hôm nay, Tuần này, Tháng này, Quý, Năm, Tùy chọn).',
        logic: '1. Tiếp nhận tham số thời gian và tenant_id từ JWT context.\n2. Thực thi truy vấn tổng hợp từ các bảng deals, customers, cash_flow, attendance.\n3. Tính toán 4 chỉ số KPI then chốt: Tổng doanh thu, Số khách hàng mới, Số thỏa thuận mở, Tỷ lệ chốt deal.\n4. Tính toán phần trăm tăng trưởng so với kỳ trước và trả về cho giao diện biểu đồ.',
        output: 'Dữ liệu số liệu KPI, tỷ lệ % tăng giảm và trạng thái biểu đồ realtime.',
        exception: 'Không có dữ liệu trong khoảng thời gian chọn: Trả về 0 kèm thông báo trạng thái rỗng.',
        api: 'GET /api/dashboard/metrics?period=month'
      },
      {
        id: 'FR-02.02',
        name: 'Biểu đồ Dòng Tiền & Doanh Thu Tích Lũy',
        actor: 'Ban Giám Đốc, CFO, Kế toán trưởng',
        input: 'Năm tài chính, loại báo cáo (Dòng tiền ròng, Doanh thu, Chi phí).',
        logic: '1. Truy vấn sổ cái thu chi từ bảng financial_transactions nhóm theo 12 tháng.\n2. Tính toán tổng thu, tổng chi và dòng tiền lũy kế theo từng chu kỳ.\n3. Trả về mảng dữ liệu phục vụ biểu đồ cột và biểu đồ đường.',
        output: 'Mảng dữ liệu 12 tháng { month, revenue, expense, net_cashflow }.',
        exception: 'Lỗi kết nối CSDL tài chính: Trả về dữ liệu cache gần nhất kèm cảnh báo.',
        api: 'GET /api/dashboard/cashflow-chart'
      }
    ]
  },
  {
    moduleNumber: '03',
    moduleName: 'Quản Trị Khách Hàng B2B & Lead 360° (Smart CRM)',
    epic: 'Hồ sơ khách hàng doanh nghiệp 360 độ, nguồn chuyển đổi và chấm điểm tiềm năng AI',
    features: [
      {
        id: 'FR-03.01',
        name: 'Quản lý Danh sách & Hồ sơ Khách hàng B2B 360 Độ',
        actor: 'Giám đốc kinh doanh, Nhân viên kinh doanh, Quản trị viên',
        input: 'Từ khóa tìm kiếm, bộ lọc nguồn (NFC Tap, Quét OCR, B2B Network, Website), phân loại nhóm.',
        logic: '1. Tiếp nhận bộ lọc và phân trang (page, limit).\n2. Truy vấn bảng customers kết hợp thông tin liên hệ, lịch sử đơn hàng, công nợ và tương tác.\n3. Trả về danh sách khách hàng có phân trang, định dạng số điện thoại và điểm tiềm năng AI.',
        output: 'Bảng danh sách khách hàng đầy đủ thông tin định danh, doanh thu và hành động nhanh.',
        exception: 'Truy vấn vượt quá phạm vi chi nhánh được phân quyền: Chặn truy cập theo ma trận RBAC.',
        api: 'GET /api/connect-app/customers'
      },
      {
        id: 'FR-03.02',
        name: 'Thêm mới & Cập nhật Hồ sơ Khách hàng B2B',
        actor: 'Nhân viên kinh doanh, Trưởng phòng',
        input: 'Tên công ty, Mã số thuế, Người liên hệ, Chức vụ, Số điện thoại, Email, Ngành nghề, Địa chỉ, Ghi chú.',
        logic: '1. Kiểm tra tính hợp lệ dữ liệu (Mã số thuế đúng 10-13 số, Email hợp lệ, SĐT đúng chuẩn).\n2. Kiểm tra trùng lặp mã số thuế hoặc số điện thoại trong cùng doanh nghiệp.\n3. Thêm mới bản ghi vào bảng customers, tự động gán người phụ trách là user đang thao tác.\n4. Kích hoạt Trợ lý AI tính điểm tiềm năng ban đầu dựa trên quy mô công ty và ngành nghề.',
        output: 'Hồ sơ khách hàng mới tạo thành công kèm mã định danh UUID duy nhất.',
        exception: 'Trùng mã số thuế: Báo lỗi "Doanh nghiệp đã tồn tại trong hệ thống" kèm liên kết đến hồ sơ cũ.',
        api: 'POST /api/connect-app/customers, PUT /api/connect-app/customers/:id'
      },
      {
        id: 'FR-03.03',
        name: 'Xuất Báo Cáo Khách Hàng Ra File Excel/CSV',
        actor: 'Giám đốc kinh doanh, Admin',
        input: 'Điều kiện lọc khách hàng cần xuất báo cáo.',
        logic: '1. Kiểm tra quyền "Xuất dữ liệu" (Export) của người dùng theo vai trò.\n2. Thu thập toàn bộ bản ghi thỏa mãn điều kiện lọc.\n3. Sinh file Excel định dạng chuẩn UTF-8 chứa đầy đủ trường dữ liệu kinh doanh.\n4. Ghi nhật ký kiểm toán hành vi xuất dữ liệu nhạy cảm vào audit_logs.',
        output: 'Tải xuống trực tiếp file Excel (.xlsx).',
        exception: 'Tài khoản không có quyền Export: Trả về mã lỗi 403 Forbidden.',
        api: 'GET /api/connect-app/customers/export'
      }
    ]
  },
  {
    moduleNumber: '04',
    moduleName: 'Quản Trị Cơ Hội Bán Hàng & Phễu Kanban Deals',
    epic: 'Quản lý các thỏa thuận thương mại qua các giai đoạn phễu kinh doanh',
    features: [
      {
        id: 'FR-04.01',
        name: 'Hiển thị Phễu Bán hàng Trực quan Dạng Bảng Kanban Deals',
        actor: 'Sales Manager, Sales Executive, Giám đốc',
        input: 'Bộ lọc giai đoạn deal, khoảng giá trị ngân sách, người phụ trách.',
        logic: '1. Truy vấn các cơ hội từ bảng opportunities theo tenant_id.\n2. Phân loại cơ hội vào 5 cột tương ứng: Mới tiếp cận, Khảo sát nhu cầu, Báo giá, Đàm phán, Chốt hợp đồng.\n3. Tính toán tổng giá trị ngân sách của từng cột phễu và tỷ lệ chuyển đổi trung bình.',
        output: 'Giao diện bảng kéo thả Kanban chứa các card thỏa thuận kinh doanh.',
        exception: 'Không có quyền xem deal của nhân viên khác: Chỉ hiển thị các deal do chính mình phụ trách.',
        api: 'GET /api/opportunities/kanban'
      },
      {
        id: 'FR-04.02',
        name: 'Kéo Thả Cập Nhật Giai Đoạn Cơ Hội (Drag & Drop Deal)',
        actor: 'Nhân viên kinh doanh, Quản lý',
        input: 'ID cơ hội (deal_id), giai đoạn đích (target_stage), lý do chuyển giai đoạn.',
        logic: '1. Kiểm tra quyền sở hữu hoặc quyền quản lý trên cơ hội.\n2. Cập nhật trường stage trong bảng opportunities.\n3. Nếu chuyển sang "Chốt hợp đồng thành công": Tự động kích hoạt luồng tạo phiếu thu và thông báo tới kế toán.\n4. Nếu chuyển sang "Thất bại": Bắt buộc nhập lý do thua deal để AI phân tích nguyên nhân.',
        output: 'Trạng thái giai đoạn cơ hội được cập nhật tức thời trên giao diện.',
        exception: 'Kéo deal vào trạng thái Thất bại nhưng bỏ trống lý do: Chặn thao tác và yêu cầu nhập lý do.',
        api: 'PATCH /api/opportunities/:id/stage'
      }
    ]
  },
  {
    moduleNumber: '05',
    moduleName: 'Quản Lý Doanh Nghiệp Thành Viên & Chi Nhánh',
    epic: 'Quản lý thông tin pháp nhân doanh nghiệp, cấu trúc tổ chức và các văn phòng chi nhánh',
    features: [
      {
        id: 'FR-05.01',
        name: 'Danh Sách Doanh Nghiệp & Mạng Lưới Chi Nhánh Trực Thuộc',
        actor: 'System Admin, Ban Giám Đốc',
        input: 'Bộ lọc trạng thái hoạt động, khu vực địa lý, từ khóa tên công ty.',
        logic: '1. Truy vấn bảng companies và branches có phân trang.\n2. Trả về thông tin mã số thuế, đại diện pháp luật, số lượng nhân sự và trạng thái kích hoạt.\n3. Cung cấp chức năng tạo chi nhánh mới gắn liền với định vị tọa độ GPS văn phòng.',
        output: 'Bảng danh sách các pháp nhân và sơ đồ chi nhánh trực thuộc.',
        exception: 'Lỗi truy vấn CSDL: Báo lỗi hệ thống và tải dữ liệu từ cache.',
        api: 'GET /api/companies, GET /api/companies/:id/branches'
      }
    ]
  },
  {
    moduleNumber: '06',
    moduleName: 'Quản Trị Thẻ Thông Minh NFC & Danh Thiếp Số 3D',
    epic: 'Cấp phát, cấu hình và quản lý vòng đời thẻ thông minh doanh nhân NFC',
    features: [
      {
        id: 'FR-06.01',
        name: 'Cấu Hình & Khởi Tạo Thẻ Thông Minh NFC (Smart Card Management)',
        actor: 'Admin, Lãnh đạo doanh nghiệp',
        input: 'Mã định danh thẻ (Card UID), ID chủ thẻ, mẫu thiết kế (Titanium, Gold, Platinum).',
        logic: '1. Đọc mã chip NFC qua đầu đọc thẻ hoặc nhập mã thẻ vật lý.\n2. Kiểm tra tính duy nhất của mã thẻ trong bảng member_business_cards.\n3. Khởi tạo liên kết giữa chip NFC và đường dẫn danh thiếp điện tử công khai (/card/:code).\n4. Sinh mã QR tương ứng và lưu trữ cấu hình bảo mật vào CSDL.',
        output: 'Thẻ thông minh được kích hoạt thành công, sẵn sàng chạm chia sẻ thông tin.',
        exception: 'Mã chip NFC đã được gắn cho người khác: Báo lỗi "Thẻ đã được kích hoạt trên hệ thống".',
        api: 'POST /api/cards/assign, GET /api/cards'
      }
    ]
  },
  {
    moduleNumber: '07',
    moduleName: 'Quản Trị Quy Trình Công Việc & Giao Việc Tự Động',
    epic: 'Phân bổ công việc theo phòng ban, thiết lập hạn chót (Deadline) và đánh giá tiến độ',
    features: [
      {
        id: 'FR-07.01',
        name: 'Khởi Tạo & Giao Nhiệm Vụ Công Việc (Task Assignment)',
        actor: 'Trưởng phòng, Quản lý dự án, Giám đốc',
        input: 'Tiêu đề nhiệm vụ, mô tả, phòng ban, người thực hiện chính, người phối hợp, hạn chót (Deadline), độ ưu tiên (Khẩn cấp, Cao, Thường).',
        logic: '1. Kiểm tra các trường thông tin bắt buộc và thời hạn deadline phải sau thời điểm hiện tại.\n2. Thêm mới bản ghi vào bảng tasks với trạng thái ban đầu là "Chờ thực hiện".\n3. Bắn thông báo thời gian thực qua WebSocket và gửi email nhắc việc đến người được giao nhiệm vụ.\n4. Cập nhật tự động vào lịch làm việc cá nhân của nhân sự.',
        output: 'Nhiệm vụ được tạo thành công, xuất hiện trên bảng Kanban công việc của phòng ban.',
        exception: 'Người được giao không thuộc phòng ban quản lý: Báo lỗi phân quyền giao việc.',
        api: 'POST /api/operations/tasks'
      },
      {
        id: 'FR-07.02',
        name: 'Giám Sát Khối Lượng Công Việc & Tải Trọng Nhân Sự (Workload Heatmap)',
        actor: 'Giám đốc vận hành (COO), Trưởng phòng',
        input: 'Phòng ban cần xem xét, khoảng thời gian đánh giá.',
        logic: '1. Truy vấn toàn bộ các nhiệm vụ đang mở và tiến độ thực tế của từng nhân viên.\n2. Tính toán tổng số việc đang xử lý đồng thời (WIP) của từng người.\n3. Nếu một nhân sự có trên 5 đầu việc phức tạp đồng thời, hệ thống tô màu đỏ cảnh báo quá tải (Overload Heatmap) để quản lý điều chuyển công việc.',
        output: 'Biểu đồ nhiệt phân bố khối lượng công việc trực quan.',
        exception: 'Dữ liệu phân tích trống: Hiển thị trạng thái phân bổ cân bằng.',
        api: 'GET /api/operations/workload'
      }
    ]
  },
  {
    moduleNumber: '08',
    moduleName: 'Quản Trị Nhân Sự & Chấm Công Tự Động (HRM & Attendance)',
    epic: 'Chấm công định vị GPS di động, nhận diện khuôn mặt và tổng hợp bảng công tính lương',
    features: [
      {
        id: 'FR-08.01',
        name: 'Chấm Công Định Vị GPS Văn Phòng & FaceID',
        actor: 'Nhân viên, Cán bộ quản lý',
        input: 'Tọa độ GPS thiết bị di động (latitude, longitude), ảnh chụp khuôn mặt selfie.',
        logic: '1. Hệ thống tiếp nhận tọa độ GPS và tính toán khoảng cách Euclidean/Haversine tới tâm chi nhánh văn phòng đã cấu hình.\n2. Kiểm tra bán kính cho phép (mặc định ≤ 50 mét).\n3. Kiểm tra ảnh selfie với ảnh mẫu hồ sơ nhân sự qua dịch vụ đối soát sinh trắc học.\n4. Ghi nhận thời gian Check-in/Check-out vào bảng attendance_logs kèm trạng thái "Đúng giờ" hoặc "Đi muộn".',
        output: 'Xác nhận chấm công thành công kèm mốc thời gian và vị trí chi nhánh.',
        exception: 'Tọa độ GPS nằm ngoài bán kính cho phép (> 50m): Từ chối chấm công kèm thông báo "Bạn đang ở ngoài khu vực văn phòng".',
        api: 'POST /api/operations/attendance/check-in'
      },
      {
        id: 'FR-08.02',
        name: 'Tổng Hợp Bảng Công & Xuất Dữ Liệu Tính Lương',
        actor: 'Phòng Nhân sự, Kế toán',
        input: 'Tháng, năm cần tổng hợp công, bộ phận phòng ban.',
        logic: '1. Truy vấn toàn bộ dữ liệu chấm công trong tháng của nhân viên.\n2. Tính toán tổng số công chuẩn, số ngày nghỉ phép có lương/không lương, số lần đi muộn/về sớm.\n3. Xuất bảng dữ liệu tổng hợp phục vụ thanh toán tiền lương.',
        output: 'Bảng tổng hợp công chi tiết từng ngày và tệp Excel báo cáo.',
        exception: 'Dữ liệu công chưa được chốt: Hiển thị cảnh báo bảng công đang mở.',
        api: 'GET /api/operations/attendance/monthly-summary'
      }
    ]
  },
  {
    moduleNumber: '09',
    moduleName: 'Phê Duyệt Tài Chính Thu Chi 3 Cấp & VietQR Napas',
    epic: 'Quy trình kiểm soát chi phí chặt chẽ, phê duyệt trực tuyến và đối soát thanh toán tự động',
    features: [
      {
        id: 'FR-09.01',
        name: 'Quy Trình Tạo & Phê Duyệt Phiếu Chi 3 Cấp',
        actor: 'Cấp 1: Nhân viên tạo đề xuất -> Cấp 2: Trưởng phòng kiểm duyệt -> Cấp 3: Giám đốc/Kế toán trưởng duyệt chi',
        input: 'Số tiền chi, lý do chi, hóa đơn chứng từ đính kèm (.pdf/.png), tài khoản thụ hưởng.',
        logic: '1. Nhân viên tạo phiếu đề xuất chi tiền, đính kèm hóa đơn chứng từ.\n2. Hệ thống chuyển phiếu sang trạng thái "Chờ Trưởng phòng duyệt", gửi thông báo push notification.\n3. Trưởng phòng kiểm tra tính hợp lý và bấm "Duyệt" -> Phiếu chuyển sang "Chờ Lãnh đạo phê duyệt".\n4. Giám đốc duyệt chi -> Kế toán thực hiện chi tiền và sinh mã VietQR Napas để chuyển khoản tự động.',
        output: 'Phiếu chi chuyển sang trạng thái "Đã thanh toán", tiền trừ vào sổ quỹ.',
        exception: 'Cấp 2 hoặc Cấp 3 bấm "Từ chối": Phiếu chuyển sang trạng thái "Bị từ chối" kèm lý do bắt buộc và hoàn về cho người lập.',
        api: 'POST /api/operations/approvals, PATCH /api/operations/approvals/:id'
      },
      {
        id: 'FR-09.02',
        name: 'Tích Hợp Thanh Toán VietQR Tự Động Đối Soát Gạch Nợ',
        actor: 'Hệ thống, Kế toán',
        input: 'Mã giao dịch, số tiền thanh toán, nội dung chuyển khoản.',
        logic: '1. Sinh mã QR động chuẩn VietQR Napas 24/7 chứa mã hóa hóa đơn.\n2. Khách hàng hoặc đối tác quét mã chuyển khoản qua ứng dụng ngân hàng.\n3. Webhook ngân hàng bắn thông báo biến động số dư về API hệ thống.\n4. Hệ thống đối soát mã hóa đơn trong nội dung chuyển tiền, tự động cập nhật hóa đơn sang "Đã thanh toán" trong 1 giây mà không cần con người can thiệp.',
        output: 'Hóa đơn được gạch nợ tự động, sinh biên lai điện tử gửi email khách hàng.',
        exception: 'Số tiền chuyển khoản không khớp với giá trị hóa đơn: Ghi nhận trạng thái "Thanh toán thiếu/thừa" và báo động cho kế toán xử lý thủ công.',
        api: 'POST /api/finance/vietqr/webhook'
      }
    ]
  },
  {
    moduleNumber: '10',
    moduleName: 'Sổ Quỹ Thu Chi & Quản Trị Dòng Tiền Doanh Nghiệp',
    epic: 'Quản lý sổ quỹ tiền mặt, tài khoản ngân hàng và báo cáo dòng tiền thời gian thực',
    features: [
      {
        id: 'FR-10.01',
        name: 'Quản Lý Sổ Quỹ Tiền Mặt & Tài Khoản Ngân Hàng',
        actor: 'Kế toán trưởng, Giám đốc tài chính (CFO)',
        input: 'Kỳ báo cáo, bộ lọc quỹ tiền mặt hoặc tài khoản ngân hàng.',
        logic: '1. Truy vấn các giao dịch thu chi đã được phê duyệt trong kỳ.\n2. Tính toán số dư đầu kỳ, tổng phát sinh tăng, tổng phát sinh giảm và số dư cuối kỳ.\n3. Đối chiếu số liệu với sao kê ngân hàng điện tử.',
        output: 'Sổ quỹ thu chi chi tiết từng giao dịch và số dư tồn quỹ khả dụng.',
        exception: 'Chênh lệch số dư sổ sách và thực tế: Bật cảnh báo điều chỉnh sổ quỹ.',
        api: 'GET /api/finance/cashflow'
      }
    ]
  },
  {
    moduleNumber: '11',
    moduleName: 'Sàn Giao Thương B2B & Quản Lý Gian Hàng Sản Phẩm',
    epic: 'Đăng tải sản phẩm, quản lý danh mục hàng hóa và xúc tiến thương mại giữa các doanh nghiệp',
    features: [
      {
        id: 'FR-11.01',
        name: 'Đăng Tải & Quản Lý Sản Phẩm Doanh Nghiệp (Marketplace)',
        actor: 'Đại diện doanh nghiệp, Nhân viên bán hàng',
        input: 'Tên sản phẩm, ngành hàng, giá niêm yết, giá ưu đãi B2B, đơn vị tính, mô tả chi tiết, hình ảnh minh họa (.png, .jpg).',
        logic: '1. Kiểm tra thông tin sản phẩm và nén ảnh tự động trước khi lưu trữ vào bucket MinIO.\n2. Thêm mới bản ghi vào bảng products với thông tin doanh nghiệp sở hữu.\n3. Niêm yết sản phẩm lên Sàn giao thương B2B ViOne Marketplace cho toàn bộ cộng đồng tiếp cận.',
        output: 'Sản phẩm được phê duyệt và hiển thị trực tiếp trên sàn thương mại B2B.',
        exception: 'Ảnh tải lên vượt quá dung lượng cho phép (> 10MB): Báo lỗi kích thước tệp.',
        api: 'POST /api/marketplace/products, GET /api/marketplace/products'
      }
    ]
  },
  {
    moduleNumber: '12',
    moduleName: 'Quản Lý Cơ Hội Giao Thương & Mời Thầu B2B',
    epic: 'Đăng tin tìm kiếm nhà cung cấp, mời thầu và kết nối cung cầu chuỗi giá trị',
    features: [
      {
        id: 'FR-12.01',
        name: 'Đăng Tin Nhu Cầu Mua Hàng & Mời Thầu (B2B Demand & RFQ)',
        actor: 'Lãnh đạo doanh nghiệp, Trưởng phòng mua hàng',
        input: 'Tiêu đề nhu cầu, lĩnh vực ngành nghề, ngân sách dự kiến, thời hạn nhận báo giá, yêu cầu tiêu chuẩn kỹ thuật.',
        logic: '1. Kiểm tra tính xác thực của thông tin doanh nghiệp đăng tin.\n2. Lưu trữ nhu cầu vào bảng opportunities với phân loại "Tìm nhà cung cấp".\n3. Trợ lý AI tự động quét từ khóa và gửi thông báo gợi ý đến các doanh nghiệp cung ứng phù hợp trong hệ thống.',
        output: 'Tin mời thầu được phát sóng trên bảng tin giao thương.',
        exception: 'Hạn nhận báo giá trước ngày hiện tại: Báo lỗi thời hạn không hợp lệ.',
        api: 'POST /api/opportunities'
      }
    ]
  },
  {
    moduleNumber: '13',
    moduleName: 'Quản Lý Sự Kiện Doanh Nghiệp & QR Check-in Điểm Danh',
    epic: 'Khởi tạo hội thảo xúc tiến thương mại, bán vé và quét mã QR điểm danh tại quầy lễ tân',
    features: [
      {
        id: 'FR-13.01',
        name: 'Khởi Tạo & Quản Lý Sự Kiện Doanh Nghiệp',
        actor: 'Ban tổ chức, Quản trị viên',
        input: 'Tên sự kiện, thời gian bắt đầu/kết thúc, địa điểm tổ chức, sơ đồ khán phòng, số lượng vé tối đa, giá vé (hoặc miễn phí).',
        logic: '1. Kiểm tra lịch tổ chức không bị trùng lặp phòng hội nghị.\n2. Lưu trữ sự kiện vào bảng events, tự động sinh trang đăng ký tham dự công khai.\n3. Thiết lập chính sách vé và sơ đồ ghế ngồi.',
        output: 'Sự kiện được công bố, mở cổng đăng ký vé cho các doanh nghiệp.',
        exception: 'Số lượng vé vượt quá sức chứa địa điểm: Cảnh báo vượt quá tải trọng hội trường.',
        api: 'POST /api/events, GET /api/events'
      },
      {
        id: 'FR-13.02',
        name: 'Quét Mã QR Check-in Điểm Danh Khách Mời Tức Thì',
        actor: 'Lễ tân, Ban tổ chức sự kiện',
        input: 'Mã QR trên vé điện tử của khách mời qua camera hoặc đầu đọc mã vạch.',
        logic: '1. Giải mã payload trong mã QR để trích xuất vé ID và mã khách mời.\n2. Kiểm tra tính hợp lệ của vé trong bảng event_registrations.\n3. Nếu vé hợp lệ và chưa điểm danh: Cập nhật trạng thái "Đã check-in" kèm mốc thời gian thực, hiển thị thông tin chào mừng C-Level trên màn hình lễ tân.\n4. Nếu vé đã được sử dụng trước đó: Báo động đỏ cảnh báo vé trùng lặp.',
        output: 'Xác nhận check-in thành công kèm số ghế ngồi của khách.',
        exception: 'Vé không tồn tại hoặc đã check-in trước đó: Báo lỗi vé không hợp lệ.',
        api: 'POST /api/events/checkin'
      }
    ]
  },
  {
    moduleNumber: '14',
    moduleName: 'Quản Lý Cuộc Gặp Kết Nối Doanh Nhân 1-on-1',
    epic: 'Đặt lịch hẹn làm việc, kết nối đối tác chiến lược và biên bản cuộc gặp',
    features: [
      {
        id: 'FR-14.01',
        name: 'Đặt Lịch Hẹn & Phê Duyệt Cuộc Gặp 1-1 (One-on-One Meetings)',
        actor: 'Lãnh đạo doanh nghiệp, Hội viên C-Level',
        input: 'Đối tác cần gặp, chủ đề trao đổi, thời gian đề xuất, địa điểm (Online hoặc Trực tiếp).',
        logic: '1. Kiểm tra lịch rảnh của cả hai bên để tránh xung đột lịch trình.\n2. Tạo bản ghi cuộc gặp trong bảng meetings với trạng thái "Chờ xác nhận".\n3. Gửi thông báo trực tiếp đến đối tác kèm lựa chọn "Đồng ý" hoặc "Đề xuất giờ khác".\n4. Khi đối tác đồng ý: Tự động thêm vào lịch làm việc trên điện thoại của cả hai bên.',
        output: 'Lịch hẹn được xác lập thành công.',
        exception: 'Đối tác từ chối cuộc hẹn: Cập nhật trạng thái và thông báo lý do.',
        api: 'POST /api/meetings, PATCH /api/meetings/:id'
      }
    ]
  },
  {
    moduleNumber: '15',
    moduleName: 'Hộp Thư Đa Kênh & Chat Trực Tiếp Messenger',
    epic: 'Hệ thống nhắn tin trao đổi kinh doanh thời gian thực, mã hóa đầu cuối giữa các CEO',
    features: [
      {
        id: 'FR-15.01',
        name: 'Nhắn Tin Trao Đổi Kinh Doanh Trực Tiếp & Chat Nhóm',
        actor: 'Toàn bộ người dùng được phân quyền',
        input: 'ID người nhận hoặc ID nhóm, nội dung văn bản, tệp đính kèm, hình ảnh.',
        logic: '1. Mã hóa nội dung tin nhắn trước khi truyền qua kênh bảo mật WebSocket Socket.IO.\n2. Lưu trữ tin nhắn vào bảng direct_messages hoặc group_messages.\n3. Phát sự kiện thời gian thực (event new_message) tới client người nhận.\n4. Nếu người nhận đang offline: Tự động kích hoạt thông báo đẩy (Push Notification) qua dịch vụ Apple APNs hoặc Google FCM.',
        output: 'Tin nhắn hiển thị tức thì trên cửa sổ trò chuyện của hai bên.',
        exception: 'Tệp đính kèm chứa mã độc hoặc vượt quá 25MB: Chặn tải lên.',
        api: 'POST /api/connect-app/dm/messages, WebSocket event: message:send'
      }
    ]
  },
  {
    moduleNumber: '16',
    moduleName: 'Trí Tuệ Nhân Tạo ViOne AI Copilot 5.0',
    epic: '6 Năng lực AI chuyên biệt: Đàm thoại điều hành, OCR danh thiếp, nhập liệu Excel, soạn hợp đồng, gợi ý đối tác và giám sát tải',
    features: [
      {
        id: 'FR-16.01',
        name: 'Trợ Lý AI Copilot Đàm Thoại Điều Hành & Báo Cáo Doanh Nghiệp',
        actor: 'CEO, Ban Lãnh Đạo C-Level',
        input: 'Câu lệnh giọng nói hoặc văn bản tự nhiên (Ví dụ: "Tóm tắt doanh thu tháng này và công nợ khách hàng lớn nhất").',
        logic: '1. Tiếp nhận câu hỏi và chuyển văn bản qua bộ xử lý ngôn ngữ tự nhiên NLP.\n2. Xác thực quyền dữ liệu của người hỏi (chỉ truy vấn dữ liệu trong phạm vi tenant được phép).\n3. Tự động sinh câu lệnh truy vấn CSDL an toàn (Text-to-SQL an toàn) để trích xuất số liệu thực tế.\n4. Tổng hợp thông tin và định dạng câu trả lời súc tích theo văn phong C-Level.\n5. Ghi nhật ký vào bảng ai_audit_logs.',
        output: 'Bản tóm tắt số liệu điều hành kèm biểu đồ và gợi ý hành động tiếp theo.',
        exception: 'Câu hỏi yêu cầu dữ liệu vượt quá quyền hạn: Trả lời "Bạn không có quyền truy cập dữ liệu tài chính này".',
        api: 'POST /api/ai/chat'
      },
      {
        id: 'FR-16.02',
        name: 'Quét & Nhận Diện Danh Thiếp OCR AI Tự Động Nhập CRM',
        actor: 'Sales Executive, Lãnh đạo',
        input: 'Ảnh chụp danh thiếp giấy từ camera hoặc tệp ảnh (.jpg, .png).',
        logic: '1. Tiếp nhận hình ảnh và tiền xử lý (cân chỉnh góc nghiêng, tăng độ tương phản).\n2. Gọi mô hình OCR nhận diện ký tự quang học trích xuất toàn bộ text trên danh thiếp.\n3. Ứng dụng mô hình AI phân loại thông tin thành các trường cấu trúc: Họ tên, Chức vụ, Tên công ty, Số điện thoại, Email, Địa chỉ, Website.\n4. Hiển thị form xem trước cho người dùng xác nhận và lưu thẳng vào hệ thống CRM.',
        output: 'Hồ sơ khách hàng mới được tạo tự động chỉ sau 2 giây quét ảnh.',
        exception: 'Ảnh quá mờ không đọc được chữ: Báo lỗi "Ảnh mờ, vui lòng chụp lại danh thiếp".',
        api: 'POST /api/ai/ocr-business-card'
      }
    ]
  },
  {
    moduleNumber: '17',
    moduleName: 'Kho Tài Liệu Số Doanh Nghiệp & Văn Bản Mẫu',
    epic: 'Quản trị văn bản số, hợp đồng mẫu, tài liệu đào tạo và phân quyền truy cập',
    features: [
      {
        id: 'FR-17.01',
        name: 'Lưu Trữ & Phân Quyền Tài Liệu Số (Document Management)',
        actor: 'Admin, Văn phòng doanh nghiệp',
        input: 'Tệp tài liệu (.pdf, .docx, .xlsx), thư mục lưu trữ, quyền xem/sửa.',
        logic: '1. Kiểm tra dung lượng và định dạng tệp tải lên.\n2. Tải tệp lên kho lưu trữ MinIO/S3 với đường dẫn phân cấp theo tenant.\n3. Lưu trữ metadata vào bảng documents kèm cấu hình phân quyền truy cập.\n4. Cung cấp liên kết tải xuống an toàn có thời hạn (Signed URL).',
        output: 'Tài liệu được lưu trữ và lập chỉ mục tìm kiếm toàn văn.',
        exception: 'Người dùng không có quyền truy cập tài liệu mật: Chặn tải tệp.',
        api: 'POST /api/documents, GET /api/documents'
      }
    ]
  },
  {
    moduleNumber: '18',
    moduleName: 'Biểu Quyết Số & Khảo Sát Doanh Nghiệp C-Level',
    epic: 'Bỏ phiếu biểu quyết đại hội cổ đông, lấy ý kiến ban điều hành minh bạch, tức thời',
    features: [
      {
        id: 'FR-18.01',
        name: 'Khởi Tạo & Tham Gia Biểu Quyết Số Trực Tuyến (Digital Voting)',
        actor: 'Chủ tịch, Ban Kiểm Soát, Thành viên biểu quyết',
        input: 'Nội dung biểu quyết, các phương án lựa chọn, thời gian bắt đầu/kết thúc, trọng số phiếu.',
        logic: '1. Khởi tạo phiên biểu quyết trong bảng voting_sessions.\n2. Thành viên đăng nhập và thực hiện bỏ phiếu xác thực bằng mật khẩu hoặc sinh trắc học.\n3. Hệ thống ghi nhận phiếu bầu vào bảng votes với cơ chế mã hóa chống sửa đổi kết quả.\n4. Tự động kiểm phiếu và công bố tỷ lệ biểu quyết thời gian thực trên màn hình lớn.',
        output: 'Kết quả biểu quyết minh bạch kèm biên bản kiểm phiếu tự động.',
        exception: 'Một tài khoản cố tình bỏ phiếu lần thứ 2: Hệ thống từ chối và thông báo "Bạn đã thực hiện biểu quyết".',
        api: 'POST /api/voting, POST /api/voting/:id/vote'
      }
    ]
  },
  {
    moduleNumber: '19',
    moduleName: 'Quản Trị Nền Tảng, Ma Trận Phân Quyền RBAC 7x6 & Multi-Tenant',
    epic: 'Quản lý ma trận phân quyền 7 nhóm quyền x 6 thao tác, cách ly dữ liệu nhiều doanh nghiệp',
    features: [
      {
        id: 'FR-19.01',
        name: 'Cấu Hình Ma Trận Phân Quyền 7 Nhóm Quyền x 6 Thao Tác (RBAC Matrix)',
        actor: 'System Admin, Quản trị viên cấp cao',
        input: 'Module chức năng (9 module), Nhóm vai trò (CEO, COO, CFO, Sales Manager, Admin, Staff, Partner), Thao tác (Xem, Tạo, Sửa, Xóa, Duyệt, Xuất).',
        logic: '1. Hệ thống hiển thị ma trận lưới phân quyền trực quan tại /platform/permissions.\n2. Quản trị viên bật/tắt các ô checkbox quyền tương ứng cho từng vai trò.\n3. Lưu trữ cấu hình phân quyền vào CSDL bảng role_permissions và đồng bộ vào bộ nhớ đệm phân quyền của NestJS Guards.\n4. Áp dụng hiệu lực tức thời cho mọi phiên đăng nhập của người dùng thuộc vai trò đó.',
        output: 'Ma trận quyền được lưu trữ, kiểm soát chặt chẽ từng hành động nhỏ nhất của người dùng.',
        exception: 'Tự ý xóa quyền Quản trị của chính mình: Chặn thao tác để tránh khóa hệ thống.',
        api: 'POST /api/platform/permissions/matrix, GET /api/platform/permissions/matrix'
      },
      {
        id: 'FR-19.02',
        name: 'Quản Trị Kiến Trúc Đa Khách Thuê (Multi-Tenant Isolation)',
        actor: 'System Admin',
        input: 'Mã định danh tenant (tenant_id), cấu hình giới hạn tài nguyên (storage, user limit).',
        logic: '1. Mọi truy vấn CSDL đều bắt buộc áp dụng bộ lọc tenant_id = current_tenant_id qua Prisma Middleware.\n2. Tách biệt hoàn toàn kho lưu trữ tệp trên MinIO/S3 theo tiền tố tenant.\n3. Đảm bảo dữ liệu kinh doanh của doanh nghiệp này tuyệt đối không thể bị truy cập bởi doanh nghiệp khác.',
        output: 'Dữ liệu được cách ly an toàn 100% giữa các tổ chức.',
        exception: 'Cố tình truy vấn chéo tenant: Trả về lỗi 403 Forbidden và kích hoạt ghi log cảnh báo an ninh.',
        api: 'POST /api/platform/tenants'
      }
    ]
  },
  {
    moduleNumber: '20',
    moduleName: 'Cài Đặt Hệ Thống, Nhận Diện Thương Hiệu & Tích Hợp',
    epic: 'Tùy biến tên miền, logo doanh nghiệp, hotline, slogan và cấu hình cổng dịch vụ thứ ba',
    features: [
      {
        id: 'FR-20.01',
        name: 'Tùy Biến Thương Hiệu & Cài Đặt Hệ Thống CRM',
        actor: 'Admin doanh nghiệp',
        input: 'Website chính hệ thống (websiteUrl), Hotline hỗ trợ, Slogan thương hiệu, Logo tải lên (.png).',
        logic: '1. Kiểm tra tính hợp lệ của đường dẫn URL và số hotline.\n2. Tải logo lên bucket lưu trữ và cập nhật cấu hình hệ thống trong bảng system_settings.\n3. Lưu trữ bền vững vào localStorage và phát sự kiện association-changed đồng bộ giao diện toàn hệ thống trong thời gian thực.\n4. Cập nhật thanh điều hướng Sidebar và trang đăng nhập theo thương hiệu riêng của doanh nghiệp.',
        output: 'Giao diện hệ thống cập nhật nhận diện thương hiệu tức thì.',
        exception: 'Định dạng logo không đúng chuẩn: Yêu cầu chọn tệp ảnh PNG/SVG.',
        api: 'POST /api/settings/branding, GET /api/settings'
      }
    ]
  },
  {
    moduleNumber: '21',
    moduleName: 'Nhật Ký Kiểm Toán & AI Audit Log (Security & Compliance)',
    epic: 'Ghi nhận toàn bộ hành vi người dùng, lịch sử gọi AI và kiểm soát an ninh ISO/IEC 27001',
    features: [
      {
        id: 'FR-21.01',
        name: 'Nhật Ký Kiểm Toán Hoạt Động & Kiểm Soát An Ninh (Audit Trail)',
        actor: 'Admin, Bộ phận An ninh mạng, Kiểm toán nội bộ',
        input: 'Bộ lọc thời gian, loại hành động (Đăng nhập, Tạo mới, Sửa, Xóa, Xuất dữ liệu), người thực hiện.',
        logic: '1. Mọi yêu cầu HTTP thay đổi trạng thái (POST, PUT, DELETE) tự động được bắt bởi NestJS AuditInterceptor.\n2. Trích xuất địa chỉ IP, User-Agent, ID người dùng, payload và phản hồi.\n3. Ghi bản ghi bất biến vào bảng audit_logs với cơ chế cấm xóa sửa.\n4. Cung cấp màn hình tra cứu kiểm toán để phục vụ thanh tra an toàn thông tin.',
        output: 'Bảng nhật ký kiểm toán minh bạch, phục vụ truy vết sự cố.',
        exception: 'Cố tình xóa sửa nhật ký kiểm toán: Hệ thống từ chối mọi câu lệnh xóa bảng audit_logs.',
        api: 'GET /api/platform/audit-logs'
      }
    ]
  },

  // --- PHAN II: UNG DUNG DI DONG VIONE CONNECT (MOBILE APP & PWA) ---
  {
    moduleNumber: '22',
    moduleName: 'Xác Thực Di Động & Đăng Ký Tài Khoản In-App',
    epic: 'Đăng ký và đăng nhập tức thì ngay trong ứng dụng di động, không redirect ra ngoài',
    features: [
      {
        id: 'FR-22.01',
        name: 'Đăng Ký Tài Khoản In-App Đa Phương Thức (Email & SĐT)',
        actor: 'Người dùng mới, Doanh nhân cài app',
        input: 'Họ và tên, Email hoặc Số điện thoại, Tên công ty/Doanh nghiệp, Mật khẩu, Xác nhận mật khẩu.',
        logic: '1. Người dùng chọn nút "Tạo tài khoản mới" ngay tại màn hình đăng nhập in-app (không chuyển hướng ra web landing).\n2. Kiểm tra tính hợp lệ dữ liệu nhập liệu trên client và gửi yêu cầu đăng ký lên backend.\n3. Hệ thống khởi tạo tài khoản mới trong CSDL, tự động sinh hồ sơ danh thiếp số ban đầu.\n4. Tự động lưu phiên xác thực vào AsyncStorage và đưa người dùng thẳng vào Trang chủ ứng dụng.',
        output: 'Tài khoản được kích hoạt và đăng nhập thành công vào app di động.',
        exception: 'Email hoặc SĐT đã tồn tại: Báo lỗi "Tài khoản đã tồn tại, vui lòng đăng nhập".',
        api: 'POST /api/auth/register'
      }
    ]
  },
  {
    moduleNumber: '23',
    moduleName: 'Trang Chủ Doanh Nhân & Thẻ Hội Viên Vuốt Tay Xuống',
    epic: 'Dashboard điều hành di động, Thẻ Doanh nhân NFC và Bottom Sheet vuốt tay mượt mà',
    features: [
      {
        id: 'FR-23.01',
        name: 'Tương Tác Thẻ Doanh Nhân Mở Bottom Sheet Bo Tròn 36px Vuốt Tay',
        actor: 'Lãnh đạo doanh nghiệp sử dụng Mobile App',
        input: 'Thao tác chạm (Tap) vào thẻ doanh nhân trên màn hình chính; Cử chỉ vuốt ngón tay xuống (Swipe Down).',
        logic: '1. Khi người dùng chạm vào Thẻ Doanh Nhân mạ vàng tại trang chủ, hệ thống kích hoạt Bottom Sheet trượt mượt mà từ dưới lên.\n2. Giao diện được bo tròn cong 36px sang trọng, viền vàng champagne, hiển thị mã QR định danh và các phím tắt chia sẻ.\n3. Tích hợp bộ điều khiển cử chỉ PanResponder: Người dùng có thể đặt ngón tay và vuốt nhẹ xuống dưới để đóng popup tự nhiên tương tự giao diện iOS gốc cao cấp.',
        output: 'Bottom Sheet mở/đóng mượt mà theo thao tác chạm và vuốt tay.',
        exception: 'Vuốt không đủ khoảng cách ngưỡng (< 50px): Tự động nảy ngược trở lại vị trí mở ban đầu.',
        api: 'In-app Component: MemberCardBottomSheet.tsx'
      }
    ]
  },
  {
    moduleNumber: '24',
    moduleName: 'Trung Tâm Hành Động 1-Chạm ViOne Mạ Vàng (VActionSheet)',
    epic: 'Nút tròn V trung tâm mạ vàng nổi bật mở bảng điều khiển siêu tốc các tác vụ lãnh đạo',
    features: [
      {
        id: 'FR-24.01',
        name: 'Kích Hoạt Nút ViOne Trung Tâm Mở VActionSheet',
        actor: 'Doanh nhân sử dụng ứng dụng di động',
        input: 'Chạm vào nút tròn ViOne dập nổi 3D vector vàng kim champagne ở giữa thanh điều hướng đáy.',
        logic: '1. Hệ thống bật bảng điều khiển VActionSheet nổi với hiệu ứng làm mờ nền kính Obsidian.\n2. Cung cấp 6 lối tắt hành động siêu tốc: Quét danh thiếp OCR, Chấm công định vị GPS, Phê duyệt chi tiền, Đăng nhu cầu B2B, Tạo cuộc hẹn 1-1, Gọi trợ lý AI Copilot.\n3. Chạm vào bất kỳ nút nào sẽ chuyển hướng ngay đến modal nghiệp vụ tương ứng.',
        output: 'Menu hành động 1-chạm xuất hiện tức thì với hiệu ứng đổ bóng phát quang kép.',
        exception: 'Chạm vào vùng ngoài bảng điều khiển: Tự động đóng action sheet mượt mà.',
        api: 'In-app Component: VActionSheet.tsx'
      }
    ]
  },
  {
    moduleNumber: '25',
    moduleName: 'Mạng Lưới Đối Tác, Stories 24h & Quét Danh Thiếp OCR',
    epic: 'Kết nối cộng đồng doanh nhân, chia sẻ khoảnh khắc kinh doanh 24h và số hóa danh thiếp giấy',
    features: [
      {
        id: 'FR-25.01',
        name: 'Bản Tin Khoảnh Khắc Doanh Nhân 24 Giờ (B2B Stories Strip)',
        actor: 'Doanh nhân, Hội viên mạng lưới',
        input: 'Ảnh chụp hoạt động kinh doanh, nội dung chú thích ngắn, thời lượng hiển thị 24h.',
        logic: '1. Người dùng đăng ảnh khoảnh khắc lên dải Stories tại đầu tab Network.\n2. Hệ thống nén ảnh và gán thời hạn hết hạn sau đúng 24 giờ kể từ thời điểm đăng.\n3. Các đối tác trong mạng lưới chạm vào avatar để xem trình chiếu toàn màn hình câu chuyện của doanh nghiệp.',
        output: 'Story hiển thị trên dải tin 24h và tự động ẩn khi hết hạn.',
        exception: 'Hết hạn 24 giờ: Chuyển story vào kho lưu trữ cá nhân, không hiển thị công khai.',
        api: 'POST /api/connect-app/moments/story, GET /api/connect-app/moments/stories'
      }
    ]
  },
  {
    moduleNumber: '26',
    moduleName: 'Hồ Sơ Danh Tính Số, Danh Thiếp Titanium 3D & Chia Sẻ Chạm NFC',
    epic: 'Danh thiếp số 3D lật mặt sang trọng, chạm NFC một chạm và bảo vệ quyền riêng tư C-Level',
    features: [
      {
        id: 'FR-26.01',
        name: 'Danh Thiếp Số Titanium 3D Lật Mặt & Chia Sẻ NFC Một Chạm',
        actor: 'Lãnh đạo doanh nghiệp',
        input: 'Thao tác chạm để lật thẻ 3D; đưa điện thoại lại gần thiết bị hỗ trợ NFC.',
        logic: '1. Thẻ danh thiếp số hiển thị với hiệu ứng 3D lật mặt trước và mặt sau mượt mà.\n2. Mặt trước hiển thị ảnh chân dung, họ tên, chức vụ, tên công ty và huy hiệu xác thực.\n3. Mặt sau hiển thị mã QR định danh và thông tin kết nối nhanh (Gọi điện, Mail, Viber, WhatsApp, Telegram).\n4. Khi chạm vào điện thoại đối tác qua chip NFC, tự động mở trang danh thiếp công khai và tải danh bạ vCard (.vcf) vào danh bạ máy đối tác chỉ trong 1 giây.',
        output: 'Đối tác nhận được toàn bộ thông tin liên hệ mà không cần cài đặt ứng dụng.',
        exception: 'Thiết bị đối tác không có chip NFC: Quét mã QR thay thế mượt mà.',
        api: 'GET /card/:code, GET /api/cards/vcard/:code'
      }
    ]
  },
  {
    moduleNumber: '27',
    moduleName: 'Giải Pháp Cài Đặt PWA 1-Chạm Trên iOS (Apple WebClip Profile)',
    epic: 'Cài đặt trực tiếp ứng dụng ViOne Connect lên Màn hình chính iPhone/iPad tương tự file APK Android',
    features: [
      {
        id: 'FR-27.01',
        name: 'Cài Đặt PWA Độc Quyền Qua File Cấu Hình Apple (.mobileconfig)',
        actor: 'Người dùng thiết bị Apple iOS (iPhone/iPad)',
        input: 'Nhấp vào liên kết tải file vione_ios_install.mobileconfig từ trình duyệt Safari.',
        logic: '1. Người dùng mở link tải file cấu hình chuẩn Apple Configuration Profile.\n2. Safari hiển thị hộp thoại: "Trang web này đang cố tải về một hồ sơ cấu hình. Cho phép?".\n3. Người dùng chọn "Cho phép" -> Mở Cài đặt máy -> "Đã tải về hồ sơ" -> Nhấn "Cài đặt".\n4. iOS tự động tạo biểu tượng ViOne Connect vàng kim ra Màn hình chính (Home Screen).\n5. Khi nhấp vào biểu tượng, ứng dụng khởi chạy ở chế độ Toàn màn hình Native (FullScreen), loại bỏ hoàn toàn thanh địa chỉ trình duyệt Safari.',
        output: 'Ứng dụng ViOne Connect được cài đặt ra màn hình chính tương tự như cài app từ App Store.',
        exception: 'Tải bằng trình duyệt Chrome trên iOS: Hiển thị hướng dẫn chuyển sang mở bằng Safari để cài profile.',
        api: 'Static Asset: /vione_ios_install.mobileconfig'
      }
    ]
  },
  {
    moduleNumber: '28',
    moduleName: 'Phân Hệ Quản Trị Cộng Đồng 2 Kiểu (B2B Networking & Company Internal)',
    epic: 'Phân định logic hiển thị, cơ chế tương tác và bảo mật giữa 2 mô hình cộng đồng kèm quyền Quản trị viên/Chủ sở hữu chỉnh sửa thông tin cộng đồng',
    features: [
      {
        id: 'FR-28.01',
        name: 'Phân Định Phân Hệ 2 Kiểu Cộng Đồng (B2B Networking vs Company Internal)',
        actor: 'Doanh nhân, Hội viên, Quản trị viên cộng đồng, Nhân viên nội bộ',
        input: 'Mã định danh cộng đồng (communityId), loại cộng đồng (community_type: b2b_networking | company_internal), vai trò thành viên (role).',
        logic: '1. Hệ thống nạp dữ liệu cộng đồng từ bảng vba_communities và kiểm tra trường community_type.\n2. Nếu là b2b_networking: Kích hoạt tab Giao thương B2B, hiển thị nút "Đăng cơ hội kinh doanh" (Buy/Sell Leads), cho phép chia sẻ bài viết, chia sẻ sự kiện ngoài vào bảng tin cộng đồng qua ShareEventModal.\n3. Nếu là company_internal: Ẩn toàn bộ tính năng đăng cơ hội B2B thương mại tự do; kích hoạt luồng "Giao việc & Phân công nhiệm vụ", nút 1-chạm [⚡ TIẾN HÀNH NHẬN VIỆC] (claim task) trực tiếp trên bài đăng công việc, tích hợp liên kết giám sát tiến độ CRM và báo cáo nội bộ.\n4. Kiểm tra quyền thành viên: Người dùng chỉ được xem và tương tác trong cộng đồng nội bộ khi đã được ban quản trị phê duyệt làm thành viên chính thức (is_active = true).',
        output: 'Giao diện cộng đồng tự động render đúng các phím chức năng, biểu mẫu đăng bài và quyền hạn tương ứng theo từng mô hình.',
        exception: 'Người dùng ngoài cố tình truy cập cộng đồng company_internal: Hệ thống chặn hiển thị và trả về cảnh báo "Cộng đồng nội bộ bảo mật, bạn cần yêu cầu quyền truy cập".',
        api: 'GET /api/connect-app/communities/:id, GET /api/connect-app/communities'
      },
      {
        id: 'FR-28.02',
        name: 'Quyền Quản Trị Cộng Đồng & Chỉnh Sửa Thông Tin (Edit Community Modal)',
        actor: 'Admin / Owner cộng đồng (Ví dụ: Cộng đồng Gia đình ViOne có canEdit: true, role: "admin")',
        input: 'Dữ liệu chỉnh sửa gồm: Tên cộng đồng, Mô tả chi tiết, Ảnh đại diện (Avatar), Ảnh bìa (Cover Banner), Phân loại cộng đồng (b2b_networking / company_internal), Quy tắc tham gia.',
        logic: '1. Kiểm tra quyền hạn của người dùng đối với cộng đồng (role === "admin" || role === "owner" hoặc canEdit === true).\n2. Nếu hợp lệ, hiển thị nút quản trị [⚙️ Chỉnh sửa cộng đồng] nổi bật trên trang chi tiết cộng đồng.\n3. Nhấp nút kích hoạt popup EditCommunityModal tải sẵn dữ liệu hiện tại của cộng đồng.\n4. Người dùng thay đổi thông tin, tải ảnh mới lên bucket lưu trữ MinIO/S3 và nhấn "Lưu thay đổi".\n5. Backend kiểm tra quyền xác thực, cập nhật bản ghi trong bảng vba_communities, đồng thời phát sự kiện realtime cập nhật giao diện người dùng.',
        output: 'Thông tin cộng đồng được cập nhật tức thì trên toàn hệ thống và ứng dụng di động.',
        exception: 'Người dùng không có quyền admin: Nút chỉnh sửa bị ẩn hoàn toàn; backend trả về lỗi 403 Forbidden nếu cố tình gọi API.',
        api: 'PATCH /api/connect-app/communities/:id, POST /api/connect-app/upload'
      }
    ]
  },
  {
    moduleNumber: '29',
    moduleName: 'Quy Trình Bày Tỏ Quan Tâm Cơ Hội & Hẹn Gặp Trao Đổi B2B Qua Chat',
    epic: 'Kết nối giao thương trực tiếp từ tin đăng cơ hội kinh doanh sang phòng chat riêng 1-1, trao đổi đề xuất hẹn gặp và tự động ghim lịch vào Trang chủ điều hành C-Level',
    features: [
      {
        id: 'FR-29.01',
        name: 'Khởi Tạo Đề Xuất Hẹn Gặp B2B Từ Tin Đăng Cơ Hội',
        actor: 'Doanh nhân, Đối tác mua/bán, Nhà đầu tư',
        input: 'Bấm nút [📅 Nhắn tin hẹn gặp trao đổi cơ hội] tại chi tiết cơ hội B2B; Thời gian hẹn (meeting_time), Địa điểm / Hình thức (Gặp trực tiếp / Trực tuyến Google Meet / Zoom), Nội dung tóm tắt nhu cầu hợp tác.',
        logic: '1. Hệ thống tiếp nhận thao tác, kiểm tra hoặc tự động tạo cuộc trò chuyện riêng 1-1 (Direct Chat Thread) giữa người quan tâm và chủ nhân bài đăng cơ hội.\n2. Mở hộp thoại ProposeOpportunityMeetingModal với thông tin cơ hội được nạp sẵn tự động.\n3. Người dùng chọn thời gian, địa điểm gặp gỡ và nhập lời mời trao đổi.\n4. Khi bấm gửi, hệ thống khởi tạo bản ghi đề xuất hẹn gặp trong CSDL, đồng thời gửi một tin nhắn định dạng thẻ tương tác đặc biệt OpportunityMeetingProposalCard vào phòng chat.',
        output: 'Thẻ đề xuất hẹn gặp hiển thị nổi bật trong khung chat với đầy đủ thông tin cơ hội, thời gian, địa điểm và hai nút hành động: [Đồng ý hẹn] và [Từ chối / Đổi giờ].',
        exception: 'Chủ tin tự gửi hẹn gặp cho chính mình: Hệ thống cảnh báo "Bạn không thể gửi đề xuất hẹn gặp cho bài đăng của chính mình".',
        api: 'POST /api/connect-app/inbox/messages, POST /api/connect-app/opportunities/:id/propose-meeting'
      },
      {
        id: 'FR-29.02',
        name: 'Xác Nhận Đề Xuất Hẹn Gặp & Tự Động Ghim Lịch Điều Hành Hôm Nay (Executive Home)',
        actor: 'Chủ bài đăng cơ hội (bên nhận đề xuất)',
        input: 'Thao tác bấm nút [Đồng ý hẹn] trên thẻ OpportunityMeetingProposalCard trong phòng chat.',
        logic: '1. Hệ thống cập nhật trạng thái đề xuất thành accepted (Đã xác nhận).\n2. Tự động khởi tạo sự kiện lịch trình vào bảng vba_calendar_events / personal_agenda của cả hai bên.\n3. Tự động ghim lịch hẹn vào danh mục "Lịch trình hôm nay" tại màn hình chính ExecutiveHome của ứng dụng di động và Web CRM.\n4. Kích hoạt dịch vụ WebSocket gửi thông báo tức thời (Push Notification) đến điện thoại của người gửi đề xuất: "Đối tác đã chấp thuận lịch hẹn trao đổi cơ hội!".',
        output: 'Thẻ trong chat chuyển sang trạng thái "Đã chốt lịch hẹn"; lịch hẹn hiển thị đồng bộ trong Lịch trình hôm nay của cả 2 doanh nhân.',
        exception: 'Cuộc hẹn đã bị hủy hoặc đối tác đã bấm từ chối trước đó: Hiển thị thông báo trạng thái cập nhật và vô hiệu hóa nút bấm.',
        api: 'PATCH /api/connect-app/inbox/meeting-proposals/:id/accept'
      }
    ]
  },
  {
    moduleNumber: '30',
    moduleName: 'Nhật Ký Ghi Âm Khoảnh Khắc Điều Hành & Ký Ức Giọng Nói (Voice Moments History)',
    epic: 'Thu âm tức thời các chỉ đạo điều hành, ý tưởng kinh doanh, cuộc họp đàm phán và lưu trữ vào CSDL kèm giao diện nghe lại trực tiếp (inline player) trên App di động',
    features: [
      {
        id: 'FR-30.01',
        name: 'Thu Âm & Lưu Trữ Khoảnh Khắc Giọng Nói C-Level',
        actor: 'Lãnh đạo doanh nghiệp, Giám đốc điều hành',
        input: 'Nhấn nút micro ghi âm tại Trung tâm hành động VActionSheet hoặc widget ghi âm nhanh; luồng âm thanh định dạng audio/m4a, webm hoặc mp3; Tiêu đề/Ghi chú tóm tắt.',
        logic: '1. Ứng dụng kích hoạt micro thiết bị thông qua MediaRecorder API hoặc React Native Audio Recorder.\n2. Hiển thị đồ thị sóng âm realtime (waveform animation) và đồng hồ đếm thời lượng ghi âm.\n3. Khi kết thúc, người dùng nhấn "Lưu bản ghi", file âm thanh được nén và tải lên kho lưu trữ MinIO/S3.\n4. Lưu thông tin metadata vào bảng CSDL vba_voice_moments_history gồm: user_id, audio_url, duration_seconds, file_size, tags, transcript_preview và thời gian tạo.',
        output: 'Bản ghi âm được lưu trữ bền vững với mã UUID duy nhất.',
        exception: 'Quyền truy cập micro bị từ chối: Hiển thị hướng dẫn cấp quyền Micro trong Cài đặt thiết bị.',
        api: 'POST /api/connect-app/voice-moments/upload, POST /api/connect-app/voice-moments'
      },
      {
        id: 'FR-30.02',
        name: 'Phân Mục Thứ 4 "Ghi Âm" & Trình Phát Âm Thanh Trực Tiếp (Inline Audio Player)',
        actor: 'Lãnh đạo C-Level, Quản trị viên',
        input: 'Chọn tab "Lịch sử" trên Trang chủ ExecutiveHome -> Chuyển sang phân mục thứ 4 "🎙️ Ghi âm" (bên cạnh Lịch sử công việc, Lịch sử cuộc gọi, Lịch sử duyệt).',
        logic: '1. Hệ thống truy vấn danh sách các bản ghi âm từ bảng vba_voice_moments_history theo user_id hiện tại.\n2. Hiển thị danh sách bản ghi gồm: Tên đoạn ghi âm, Thời lượng (phút:giây), Ngày giờ thu âm, dung lượng tệp.\n3. Tích hợp Trình phát âm thanh trực tiếp (Inline Audio Player) với nút Play/Pause, thanh kéo tua âm thanh và điều chỉnh âm lượng.\n4. Cung cấp nút chia sẻ nội bộ hoặc tải tệp âm thanh gốc về máy.',
        output: 'Người dùng nghe lại toàn bộ các chỉ đạo bằng giọng nói ngay trên màn hình chính mà không cần mở ứng dụng ngoài.',
        exception: 'Tệp âm thanh bị lỗi đường truyền: Tự động thử lại hoặc hiển thị tùy chọn tải lại bản ghi.',
        api: 'GET /api/connect-app/voice-moments'
      }
    ]
  },
  {
    moduleNumber: '31',
    moduleName: 'Trợ Lý Giám Đốc AI Copilot 5.0 Đa Tác Vụ & Tìm Kiếm Giọng Nói',
    epic: 'Siêu trợ lý điều hành doanh nghiệp tích hợp đa mô hình ngôn ngữ lớn (LLM), truy vấn âm thanh bằng giọng nói, quét đối tác quanh đây và phân tích động kèm Evidence Cards',
    features: [
      {
        id: 'FR-31.01',
        name: 'Tìm Kiếm Đoạn Ghi Âm Theo Lệnh Giọng Nói (Voice-Driven Audio Search)',
        actor: 'CEO, Lãnh đạo doanh nghiệp',
        input: 'Khẩu lệnh giọng nói hoặc văn bản tự nhiên (Ví dụ: "Tìm đoạn ghi âm tuần trước tôi nói về hợp đồng với đối tác Hòa Phát").',
        logic: '1. Trợ lý AI nhận diện giọng nói qua Speech-to-Text (Whisper / Google STT).\n2. Trích xuất thực thể thời gian, từ khóa ngữ nghĩa và đối tượng nhắc tới.\n3. Truy vấn bảng vba_voice_moments_history kết hợp vector embedding nội dung transcript.\n4. Trả về đúng đoạn ghi âm khớp nhất kèm mốc thời gian phát chính xác.',
        output: 'Thẻ phát âm thanh trực tiếp hiển thị ngay trong hội thoại AI với nút nghe đúng vị trí được hỏi.',
        exception: 'Không tìm thấy bản ghi âm phù hợp: AI phản hồi thông minh và gợi ý mở rộng khoảng thời gian tìm kiếm.',
        api: 'POST /api/connect-app/ai/voice-search'
      },
      {
        id: 'FR-31.02',
        name: 'Quét Tìm Đối Tác & Người Dùng ViOne Quanh Đây Theo Bán Kính GPS',
        actor: 'Doanh nhân đang đi công tác, tham gia sự kiện triển lãm',
        input: 'Tọa độ GPS hiện tại (Latitude, Longitude), bán kính quét lựa chọn (1km, 5km, 10km, 20km).',
        logic: '1. Người dùng bật tính năng "Tìm đối tác quanh đây" trên AI Copilot hoặc tab Network.\n2. Ứng dụng xin quyền vị trí và gửi tọa độ địa lý lên backend.\n3. Hệ thống sử dụng thuật toán tính khoảng cách không gian (PostGIS ST_DWithin / Haversine) quét danh sách người dùng ViOne đang bật chế độ kết nối xung quanh.\n4. Trả về danh sách đối tác gồm họ tên, công ty, ngành nghề kinh doanh, khoảng cách (ví dụ: cách bạn 350m) và bản đồ nhiệt trực quan.',
        output: 'Danh sách hồ sơ đối tác gần nhất kèm phím tắt chạm kết nối, gửi lời chào hoặc hẹn cà phê 1-chạm.',
        exception: 'Người dùng tắt chia sẻ vị trí: Hệ thống bảo mật ẩn vị trí và chỉ hiển thị đối tác trong cùng thành phố/tỉnh.',
        api: 'POST /api/connect-app/partners/nearby'
      },
      {
        id: 'FR-31.03',
        name: 'Phân Tích Động Cơ Hội Kinh Doanh Kèm Evidence Cards & Bắn Thông Báo Đa Tương Tác',
        actor: 'Giám đốc điều hành, Trưởng phòng kinh doanh',
        input: 'Yêu cầu phân tích phễu bán hàng, cơ hội B2B hoặc báo cáo tài chính.',
        logic: '1. AI Copilot phân tích dữ liệu thực tế từ CRM và cơ hội giao thương B2B.\n2. Tự động sinh các thẻ bằng chứng dữ liệu trực quan (Evidence Cards) gồm số liệu tăng trưởng, bảng đối soát và biểu đồ mini.\n3. Đưa ra gợi ý hành động chiến lược (Actionable Insights).\n4. Hỗ trợ cơ chế bắn thông báo đa tương tác (Interactive Push Notifications) với các nút hành động nhanh ngay trên thông báo điện thoại (Duyệt ngay / Nhắn tin / Xem chi tiết).',
        output: 'Hội thoại tư vấn phân tích chuyên sâu kèm Evidence Cards và thông báo đẩy tương tác.',
        exception: 'Dữ liệu chưa đủ chu kỳ phân tích: AI hiển thị cảnh báo mức độ tin cậy của dữ liệu và đề xuất nhập bổ sung.',
        api: 'POST /api/ai/analyze-opportunities, POST /api/notifications/interactive-push'
      }
    ]
  },
  {
    moduleNumber: '32',
    moduleName: 'Bảng Điều Hành Lịch Trình Tác Nghiệp Hôm Nay & Duyệt Hồ Sơ C-Level Mobile (Executive Home & Approvals)',
    epic: 'Trung tâm điều hành di động hợp nhất toàn bộ lịch trình công việc, các cuộc hẹn đối tác B2B và phê duyệt hồ sơ giấy tờ mọi lúc mọi nơi cho lãnh đạo bận rộn',
    features: [
      {
        id: 'FR-32.01',
        name: 'Lịch Trình Tác Nghiệp Hôm Nay (Today\'s Executive Agenda)',
        actor: 'CEO, Lãnh đạo doanh nghiệp',
        input: 'Mở màn hình chính ExecutiveHome trên App ViOne Connect.',
        logic: '1. Hệ thống tự động truy vấn và tổng hợp 3 nguồn lịch trình trong ngày hôm nay:\n   - Lịch họp nội bộ và công việc được giao từ module Quản lý công việc CRM.\n   - Lịch hẹn gặp đối tác giao thương B2B đã được cả hai bên xác nhận (từ Module 29).\n   - Sự kiện hội thảo, gala doanh nhân mà người dùng đã đăng ký vé QR.\n2. Hiển thị dạng dòng thời gian (Timeline) rõ ràng theo từng khung giờ: Sáng, Chiều, Tối.\n3. Nhấp vào mỗi thẻ lịch trình mở ngay chi tiết cuộc họp, phòng họp trực tuyến hoặc vị trí trên Google Maps.',
        output: 'Lịch trình hôm nay toàn diện, cập nhật theo thời gian thực không bỏ sót sự kiện.',
        exception: 'Không có lịch trình trong ngày: Hiển thị thông điệp "Hôm nay bạn không có lịch trình nào, tận hưởng một ngày làm việc hiệu quả!".',
        api: 'GET /api/connect-app/executive/today-agenda'
      },
      {
        id: 'FR-32.02',
        name: 'Trung Tâm Duyệt Hồ Sơ Nhanh Di Động (Approvals Mobile Sheet)',
        actor: 'Ban Giám Đốc, Kế toán trưởng, Trưởng bộ phận',
        input: 'Chạm vào biểu tượng "Duyệt hồ sơ" hoặc thẻ số lượng cần duyệt trên ExecutiveHome.',
        logic: '1. Mở giao diện Approvals Mobile Sheet hiển thị danh sách các hồ sơ đang chờ ký duyệt: Đơn nghỉ phép nhân viên, Đề xuất chi tiền tạm ứng, Hóa đơn thanh toán, Hợp đồng kinh tế.\n2. Phân loại theo mức độ khẩn cấp (Khẩn cấp, Bình thường) và số tiền.\n3. Cung cấp 2 phím tắt hành động 1-chạm: [Phê duyệt ngay] (kèm mã PIN hoặc FaceID) và [Từ chối / Yêu cầu giải trình].\n4. Ghi nhận nhật ký kiểm toán và tự động đồng bộ trạng thái về Web CRM trong thời gian thực.',
        output: 'Hồ sơ được phê duyệt lập tức, thông báo tự động chuyển đến nhân viên đề xuất.',
        exception: 'Không đủ hạn mức phê duyệt: Hiển thị thông báo chuyển hồ sơ lên cấp phê duyệt cao hơn (CEO/CFO).',
        api: 'GET /api/connect-app/approvals/pending, POST /api/connect-app/approvals/:id/decide'
      }
    ]
  },
  {
    moduleNumber: '33',
    moduleName: 'Bắt Tay Kết Nối Song Phương QR Thời Gian Thực & Trình Chỉnh Sửa Hồ Sơ Native Parity',
    epic: 'Cơ chế kết nối song phương qua WebSocket khi quét QR, bộ công cụ cập nhật danh tính số C-Level thuần Native và Trợ lý AI Copilot đa năng',
    features: [
      {
        id: 'FR-33.01',
        name: 'Bắt Tay Kết Nối Song Phương Thời Gian Thực (Bilateral QR Handshake Flow)',
        actor: 'Hai doanh nhân quét mã QR của nhau (Web PWA và Native Mobile)',
        input: 'Doanh nhân A quét mã QR của Doanh nhân B, gửi sự kiện WebSocket qr:connect.',
        logic: '1. Doanh nhân A mở ScanQrModal quét mã QR của Doanh nhân B.\n2. Ứng dụng phát sự kiện WebSocket "qr:connect" tới ConnectAppGateway.\n3. Gateway nhận diện socket của Doanh nhân B và emit sự kiện "connection:incoming".\n4. Màn hình Doanh nhân B tự động hiển thị IncomingQrConnectionModal (Mobile) hoặc IncomingConnectionModal (Web) với thông tin hồ sơ của A.\n5. Doanh nhân B bấm [Đồng ý kết nối] -> phát "connection:respond" (accepted). Gateway cập nhật kết nối hai chiều trong CSDL, bắn thông báo xác nhận cho A và mở luồng chat 1-1.',
        output: 'Kết nối song phương xác lập thành công tức thì trên cả 2 thiết bị.',
        exception: 'Doanh nhân B từ chối: Phát "connection:respond" (declined), đóng modal và không lưu kết nối.',
        api: 'WS qr:connect, WS connection:incoming, WS connection:respond, WS connection:accepted'
      },
      {
        id: 'FR-33.02',
        name: 'Trình Chỉnh Sửa Hồ Sơ Cá Nhân Doanh Nhân Thuần Native (Native Edit Profile Parity)',
        actor: 'Doanh nhân thành viên C-Level',
        input: 'Bấm nút [Chỉnh sửa] trên màn hình ProfileScreen Native.',
        logic: '1. Mở EditProfileModal thuần Native với đầy đủ 8 trường thông tin chuẩn Web: Họ tên hiển thị, Chức danh, Tên doanh nghiệp, Ngành nghề, Số điện thoại, Email, Website, Tiểu sử.\n2. Người dùng chỉnh sửa và bấm [Lưu thay đổi].\n3. Ứng dụng gọi API PATCH /users/profile (hoặc lưu offline cache AsyncStorage).\n4. Cập nhật hồ sơ trong AuthContext, đồng bộ danh thiếp số 3D Titanium và làm mới giao diện Profile tức thì.',
        output: 'Thông tin cá nhân và danh thiếp doanh nhân được cập nhật chuẩn xác 100%.',
        exception: 'Dữ liệu không hợp lệ (email sai định dạng): Báo lỗi tại trường nhập liệu tương ứng.',
        api: 'PATCH /api/users/profile, GET /api/users/me'
      },
      {
        id: 'FR-33.03',
        name: 'Trợ Lý AI Copilot Đa Năng Dynamic Nắm Trọn Vẹn Dữ Liệu Nền Tảng',
        actor: 'Toàn bộ người dùng hệ thống',
        input: 'Câu hỏi của người dùng về sự kiện, cộng đồng, tài khoản, cơ hội kinh doanh (Text hoặc Voice).',
        logic: '1. Tiếp nhận câu hỏi tại ViOneVoiceAssistantModal (Mobile) hoặc ViOneVoiceAssistant (Web).\n2. Backend AiService phân tích ý định động, truy xuất CSDL thời gian thực: sự kiện đang diễn ra, danh sách cộng đồng đã tham gia, chỉ số kết nối tài khoản, cơ hội kinh doanh mới.\n3. Tổng hợp câu trả lời tự nhiên như Chief of Staff, kèm Evidence Cards và Suggested Actions 1-chạm.\n4. Giao diện modal tối ưu: Header không đè lấn sóng micro, Footer nhập liệu luôn cố định ở đáy.',
        output: 'Phản hồi thông thái, chính xác 100% dữ liệu nền tảng, không rập khuôn.',
        exception: 'Mất kết nối mạng: Chuyển sang bộ dữ liệu fallback nội bộ thông minh.',
        api: 'POST /api/ai/chat'
      }
    ]
  },
  {
    moduleNumber: '34',
    moduleName: 'ViOne AI Copilot Đa Năng, Xuất Báo Cáo Excel Thực Tế & Bảng Điều Hành Executive PostgreSQL',
    epic: 'Trợ lý AI đối thoại thông minh, trích xuất bảng tính Excel (.xlsx) chuẩn C-Level từ CSDL thực, bảng điều hành lưu lượng web landing và sổ cái tài chính PostgreSQL',
    features: [
      {
        id: 'FR-34.01',
        name: 'Dynamic ViOne AI Copilot & Xuất Báo Cáo Excel (.xlsx) Tự Động',
        actor: 'Ban Lãnh Đạo C-Level, Quản lý tài chính, Nhân sự, Sales',
        input: 'Câu lệnh hỏi đáp có từ khóa xuất dữ liệu: "báo cáo tài chính", "excel thu chi", "chấm công", "danh sách hội viên", "trình ký".',
        logic: '1. AiService.chat() nhận diện ý định xuất báo cáo.\n2. Gọi generateExcelReport(reportType, options) truy vấn PostgreSQL: finance (transactions, invoices), attendance (member_checkins), members, traffic (landing_page_visits), approvals (document_approvals).\n3. Dùng exceljs tạo workbook Navy & Champagne Gold, auto column widths, định dạng tiền tệ VND, SUM formula.\n4. Trả về downloadUrl /api/ai/download-excel/:id.',
        output: 'File Excel .xlsx chuẩn doanh nghiệp tải về máy.',
        exception: 'Không có dữ liệu trong kỳ: Sinh bảng tính thông báo không phát sinh dữ liệu.',
        api: 'POST /api/ai/export-excel, GET /api/ai/download-excel/:id, POST /api/ai/chat'
      },
      {
        id: 'FR-34.02',
        name: 'Bảng Điều Hành Lưu Lượng Web Landing Doanh Nghiệp Thời Gian Thực',
        actor: 'Tổng Giám Đốc, Ban Quản Trị, Marketing Director',
        input: 'Bộ chọn chu kỳ: Ngày, Tuần, Tháng.',
        logic: '1. API GET /api/admin/traffic-analytics truy vấn bảng landing_page_visits.\n2. Thống kê Hôm nay, Hôm qua, Tuần này, Tháng này và tăng trưởng tuần.\n3. Trả về biểu đồ AreaChart và bảng xếp hạng Top Landing Pages.',
        output: 'Chỉ số lưu lượng và đồ thị biến động traffic trực quan.',
        exception: 'Không kết nối được DB: Fallback số liệu cache gần nhất.',
        api: 'GET /api/admin/traffic-analytics'
      }
    ]
  },
  {
    moduleNumber: '35',
    moduleName: 'Hoàn Thiện 5 Phân Hệ Cốt Lõi Hệ Sinh Thái ViOne C-Level',
    epic: 'AI Copilot trung thực & typewriter streaming, đăng tin linh hoạt, tin nhắn tự khởi tạo luồng, chỉnh sửa thẻ trang chủ tinh gọn & CRM khách hàng điều hành',
    features: [
      {
        id: 'FR-35.01',
        name: 'AI Copilot Trung Thực Tuyệt Đối & Hiệu Ứng Typewriter Streaming',
        actor: 'Mọi người dùng, Lãnh đạo doanh nghiệp',
        input: 'Câu hỏi: "tôi có bao nhiêu bạn bè", "danh sách bạn bè".',
        logic: '1. Truy vấn CSDL thực tế public.user_connections với status = accepted.\n2. Khi kết nối = 0: Tuyệt đối không giả lập 156 bạn bè; báo cáo trung thực 0 kết nối và gợi ý đối tác tiềm năng thực từ public.vione_users đồng bộ với Tab Mạng lưới.\n3. Hiển thị hiệu ứng gõ chữ Typewriter Streaming từng ký tự kèm con trỏ nhấp nháy ▎ (chu kỳ 14ms).',
        output: 'Phản hồi trung thực, mượt mà và gợi ý đối tác thực.',
        exception: 'Lỗi mạng: Fallback thông minh báo cáo 0 kết nối.',
        api: 'POST /api/ai/chat'
      },
      {
        id: 'FR-35.02',
        name: 'Đăng Tin & Khoảnh Khắc Linh Hoạt & Đính Kèm Ảnh Bền Vững',
        actor: 'Doanh nhân, Thành viên cộng đồng',
        input: 'Nội dung bài viết, chủ đề/chuyên mục tùy chọn, ảnh đính kèm tùy chọn.',
        logic: '1. Chủ đề/chuyên mục không bắt buộc (mặc định null), có nút [Bỏ chọn chủ đề] / [Bỏ chọn chuyên mục].\n2. Bỏ ảnh mẫu cưỡng ép, cho phép bài thuần text hoặc ảnh thật.\n3. Backend prepareMoment lưu storage_path vào media và finalizeMoment bảo vệ media slots.',
        output: 'Bài viết/khoảnh khắc xuất bản thành công kèm ảnh nguyên vẹn.',
        exception: 'Tải ảnh thất bại: Thông báo và cho phép đăng bài dạng text.',
        api: 'POST /connect-app/moments/prepare, POST /connect-app/moments/finalize'
      },
      {
        id: 'FR-35.03',
        name: 'Hộp Thư Tin Nhắn Phân Giải Đối Tác & Khắc Phục Lỗi Tiền Tố Thread ID',
        actor: 'Người gửi và Người nhận tin nhắn',
        input: 'Thread ID hoặc Counterpart ID (th-, u:, p:), nội dung tin nhắn.',
        logic: '1. Backend bóc tách an toàn các tiền tố th-, u:, p: trước khi kiểm tra UUID.\n2. Tự động khởi tạo thread mới nếu counterpart UUID chưa có thread, tránh lỗi thread_not_found.\n3. listMyDmThreads truy vấn vione_users đảm bảo trả về tên, avatar và counterpartUserId.',
        output: 'Hộp thư hiển thị đầy đủ mọi tài khoản đã chat và mở kênh chat 1-1 liền mạch.',
        exception: 'ID không hợp lệ: Báo lỗi định dạng ID.',
        api: 'GET /connect-app/dm/threads, GET /connect-app/dm/threads/:id, POST /connect-app/dm/threads/:id/messages'
      },
      {
        id: 'FR-35.04',
        name: 'Chỉnh Sửa Nhanh Thẻ Doanh Nhân Trang Chủ & Khử Trùng Lặp Nút Upload',
        actor: 'Doanh nhân chủ tài khoản',
        input: 'Mở trang chủ hoặc bấm chỉnh sửa thẻ.',
        logic: '1. HomeScreen tự động gọi meApi.getIdentity() nạp avatar_url và cover_url từ vione_users.\n2. Backend upsertMyIdentity đồng bộ hai chiều sang vione_users.\n3. Modal QuickEditProfileModal chỉ giữ đúng 1 nút tải ảnh bìa và 1 nút tải avatar.',
        output: 'Ảnh bìa và avatar hiển thị ổn định, giao diện chỉnh sửa tinh gọn.',
        exception: 'Lỗi tải ảnh: Fallback gradient mạ vàng sang trọng.',
        api: 'GET /connect-app/me/identity, PUT /connect-app/me/identity'
      },
      {
        id: 'FR-35.05',
        name: 'Quản Trị Khách Hàng CRM Chuẩn Điều Hành C-Level',
        actor: 'Lãnh đạo doanh nghiệp, Giám đốc kinh doanh, Sales',
        input: 'Quản lý danh sách khách hàng và cơ hội trong Tab Mạng lưới.',
        logic: '1. 4 Thẻ chỉ số Pipeline điều hành mạ vàng: Quy mô cơ hội, Đang đàm phán, Tỷ lệ chốt deal, Lịch chăm sóc tuần.\n2. Stage Filter Pills: Tất cả, Đàm phán, Đề xuất, Ký kết.\n3. Stepper tương tác 4 giai đoạn: Tiếp cận -> Tư vấn -> Đàm phán -> Ký kết chuyển trạng thái 1-chạm.\n4. Chỉ báo Deal Health (Nóng 90%, Ổn định 70%, Cần chăm sóc 40%) và Touchpoint Logs đa kênh.\n5. Kết nối onUpdateCustomer cập nhật phản ứng tức thì ra danh sách ngoài.',
        output: 'Giao diện CRM khách hàng di động chuẩn Executive C-Level.',
        exception: 'Dữ liệu thiếu trường: Tự động gán mặc định an toàn.',
        api: 'GET /connect-app/network/customers, POST /connect-app/network/customers'
      }
    ]
  }
];

// 1. Tạo file Markdown SRS cực kỳ chi tiết
console.log('>>> [1] Tao file Markdown SRS sieu chi tiet...');
let mdContent = `# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) TOÀN DIỆN HỆ THỐNG VÀ APP VIONE
## CHUẨN QUỐC TẾ IEEE 830 - PHÂN RÃ MECE CHI TIẾT KHÔNG BỎ SÓT CHỨC NĂNG
**Dự án:** Hệ Thống Quản Trị Doanh Nghiệp Toàn Diện ViOne & Mạng Xã Hội Giao Thương Doanh Nhân B2B ViOne Connect  
**Mã tài liệu:** SRS-VIONE-MASTER-6.0 | **Ngày ban hành:** 05/10/2026 | **Phiên bản:** 6.0 Enterprise  
**Đơn vị thực hiện:** Senior Business Analyst & Solution Architect Team (15 năm kinh nghiệm)

---

## MỤC LỤC TỔNG QUAN

1. [PHẦN 1: GIỚI THIỆU CHUNG (INTRODUCTION)](#phần-1-giới-thiệu-chung-introduction)
   - 1.1 Mục Đích Tài Liệu
   - 1.2 Phạm Vi Dự Án
   - 1.3 Thuật Ngữ Và Viết Tắt (Definitions & Acronyms)
2. [PHẦN 2: MÔ TẢ TỔNG QUAN HỆ THỐNG (OVERALL DESCRIPTION)](#phần-2-mô-tả-tổng-quan-hệ-thống-overall-description)
   - 2.1 Danh Sách & Quyền Hạn Toàn Bộ User Roles
   - 2.2 Ánh Xạ 5 Hành Trình Người Dùng Toàn Diện (User Journeys)
   - 2.3 Môi Trường Hoạt Động & Yêu Cầu Hạ Tầng (Operating Environment)
3. [PHẦN 3: ĐẶC TẢ YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS)](#phần-3-đặc-tả-yêu-cầu-chức-năng-chi-tiết-functional-requirements)
   - *Phân hệ I: Web CRM ViOne Platform (21 Phân hệ)*
   - *Phân hệ II: Mobile App ViOne Connect Native & PWA (11 Phân hệ)*
4. [PHẦN 4: YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)](#phần-4-yêu-cầu-phi-chức-năng-non-functional-requirements---nfr)
   - 4.1 Hiệu Năng Hệ Thống (Performance)
   - 4.2 Bảo Mật & Tuân Thủ (Security & Compliance)
   - 4.3 Tính Khả Dụng & Trải Nghiệm (Usability)
   - 4.4 Độ Tin Cậy & Khôi Phục Thảm Họa (Reliability & Disaster Recovery)
5. [PHẦN 5: YÊU CẦU GIAO TIẾP VÀ TÍCH HỢP HỆ THỐNG (SYSTEM INTERFACES)](#phần-5-yêu-cầu-giao-tiếp-và-tích-hợp-hệ-thống-system-interfaces)

---

### PHẦN 1: GIỚI THIỆU CHUNG (INTRODUCTION)

#### 1.1 Mục Đích Tài Liệu
Tài liệu Software Requirements Specification (SRS) này được biên soạn bởi Senior Business Analyst và System Architect theo chuẩn quốc tế **IEEE 830-1998 (Recommended Practice for Software Requirements Specifications)**. Tài liệu đặc tả chi tiết, toàn diện và đầy đủ 100% tất cả các yêu cầu chức năng (FR) và phi chức năng (NFR) cho Hệ thống Quản trị Doanh nghiệp ViOne CRM và Ứng dụng Di động ViOne Connect. Đây là căn cứ kỹ thuật duy nhất phục vụ công tác phát triển mã nguồn, kiểm thử chấp nhận (UAT), nghiệm thu và bàn giao hệ thống cho Chủ đầu tư.

#### 1.2 Phạm Vi Dự Án
Phạm vi dự án bao gồm hai trụ cột công nghệ hợp nhất:
1. **Nền Tảng Quản Trị Doanh Nghiệp ViOne CRM (Web Portal):** Bộ công cụ quản trị B2B toàn diện gồm Quản lý quan hệ khách hàng, Phễu bán hàng Kanban Deals, Quản trị quy trình tự động, Chấm công định vị GPS & FaceID, Phê duyệt tài chính 3 cấp, Đối soát ngân hàng VietQR, Sàn giao thương B2B, Trí tuệ nhân tạo AI Copilot 5.0, và Ma trận phân quyền 7x6 theo kiến trúc Multi-Tenant (21 Phân hệ).
2. **Ứng Dụng Di Động ViOne Connect (Mobile App Native & PWA):** Ứng dụng di động cao cấp dành cho lãnh đạo C-Level, tích hợp danh thiếp số NFC, Thẻ doanh nhân mở Bottom Sheet vuốt tay xuống, Sàn kết nối cung cầu B2B, Kênh chat trực tiếp gửi thẻ đề xuất hẹn gặp ghim lịch điều hành, Phân hệ cộng đồng 2 kiểu (B2B vs Nội bộ), Nhật ký ghi âm khoảnh khắc điều hành, Trợ lý AI Copilot 5.0 đa tác vụ tìm kiếm bằng giọng nói và quét đối tác quanh đây, Trung tâm duyệt hồ sơ 1-chạm di động và giải pháp cài đặt 1-chạm độc quyền cho iOS (.mobileconfig) (11 Phân hệ).

#### 1.3 Thuật Ngữ Và Viết Tắt
- **CRM:** Customer Relationship Management (Quản lý quan hệ khách hàng).
- **ERP:** Enterprise Resource Planning (Hoạch định tài nguyên doanh nghiệp).
- **RBAC:** Role-Based Access Control (Kiểm soát truy cập dựa trên vai trò).
- **NFC:** Near Field Communication (Giao tiếp trường gần - Chạm truyền dữ liệu).
- **OCR:** Optical Character Recognition (Nhận dạng ký tự quang học).
- **MECE:** Mutually Exclusive, Collectively Exhaustive (Không trùng lặp, Không bỏ sót).
- **PWA:** Progressive Web App (Ứng dụng web tiến bộ).
- **JWT:** JSON Web Token (Chuẩn xác thực phân tán an toàn).

---

### PHẦN 2: MÔ TẢ TỔNG QUAN HỆ THỐNG (OVERALL DESCRIPTION)

#### 2.1 Danh Sách & Quyền Hạn Toàn Bộ User Roles
Hệ thống xác định 7 nhóm vai trò chuẩn mực:
1. **System Administrator (Super Admin):** Quản trị toàn bộ nền tảng, quản lý danh sách tenant, cấu hình ma trận phân quyền hệ thống, xem nhật ký kiểm toán toàn diện.
2. **Tổng Giám Đốc / Chủ Tịch (CEO):** Xem toàn bộ bảng điều hành số C-Level, phê duyệt tài chính cấp cao nhất (Cấp 3), ra quyết định giao việc, kích hoạt biểu quyết số.
3. **Giám Đốc Vận Hành (COO):** Giám sát khối lượng công việc và nhiệt tải nhân sự (Workload Heatmap), thiết lập quy trình tự động, quản lý chấm công nhân sự.
4. **Giám Đốc Tài Chính / Kế Toán Trưởng (CFO / Chief Accountant):** Kiểm soát sổ quỹ thu chi, dòng tiền, phê duyệt tài chính Cấp 2 và Cấp 3, cấu hình cổng VietQR đối soát tự động.
5. **Giám Đốc Kinh Doanh / Trưởng Phòng Sales (Sales Manager):** Quản lý toàn bộ phễu bán hàng Kanban Deals, quản trị hồ sơ khách hàng 360 độ, phân bổ khách hàng cho sales.
6. **Nhân Viên Chuyên Môn / Kinh Doanh (Staff / Sales Executive):** Chăm sóc khách hàng được phân bổ, cập nhật giai đoạn deal, đề xuất phiếu chi (Cấp 1), chấm công di động.
7. **Hội Viên Doanh Nhân / Đối Tác (Partner / Member):** Sử dụng App ViOne Connect, sở hữu danh thiếp số NFC, đăng tin nhu cầu mua bán, tham gia sự kiện và kết nối 1-on-1.

#### 2.2 Ánh Xạ 5 Hành Trình Người Dùng Toàn Diện (User Journeys)
1. **Hành trình Quản trị & Điều hành Doanh nghiệp (CEO/COO):** Đăng nhập Web CRM -> Xem KPI Dashboard -> Kiểm tra cảnh báo tải việc nhân sự -> Duyệt phiếu chi ngân sách Cấp 3 -> Kích hoạt cuộc họp biểu quyết số.
2. **Hành trình Bán hàng B2B & Chăm sóc Khách hàng (Sales Executive):** Nhận lead mới -> Chấm điểm AI Lead Score -> Gọi điện / Email tư vấn -> Kéo deal qua các giai đoạn Kanban -> Chốt hợp đồng thành công.
3. **Hành trình Kiểm soát Dòng tiền & Thanh toán (Kế toán trưởng):** Nhận thông báo đề xuất chi -> Thẩm định hóa đơn chứng từ -> Trình duyệt Giám đốc -> Sinh mã VietQR chuyển khoản -> Đối soát gạch nợ tự động.
4. **Hành trình Giao thương Di động & Chạm Danh thiếp NFC (Doanh nhân C-Level):** Mở App ViOne -> Chạm thẻ mở Bottom Sheet vuốt tay -> Chạm NFC chia sẻ danh thiếp số -> Quét danh thiếp đối tác bằng OCR -> Lưu vào CRM.
5. **Hành trình Tham gia Sự kiện & QR Check-in (Khách mời sự kiện):** Khám phá sự kiện trên App -> Đăng ký nhận vé QR VIP -> Đến hội trường -> Quét mã QR tại bàn lễ tân điểm danh trong 1 giây.

---

### PHẦN 3: ĐẶC TẢ YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS)
`;

srsModules.forEach(mod => {
  mdContent += `\n#### MODULE ${mod.moduleNumber}: ${mod.moduleName.toUpperCase()}\n`;
  mdContent += `*Mục tiêu Epic:* ${mod.epic}\n\n`;

  mod.features.forEach(feat => {
    mdContent += `##### ${feat.id} - ${feat.name}\n`;
    mdContent += `- **Actor:** ${feat.actor}\n`;
    mdContent += `- **Input:** ${feat.input}\n`;
    mdContent += `- **Logic Xử Lý:**\n${feat.logic.split('\n').map(l => `  ${l}`).join('\n')}\n`;
    mdContent += `- **Output:** ${feat.output}\n`;
    mdContent += `- **Luồng Ngoại Lệ (Exception Handling):** ${feat.exception}\n`;
    mdContent += `- **RESTful API Endpoint:** \`${feat.api}\`\n\n`;
  });
});

mdContent += `
---

### PHẦN 4: YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)

#### 4.1 Hiệu Năng Hệ Thống (Performance)
- **Thời gian phản hồi API (API Response Time):** 95% các yêu cầu truy vấn API thông thường phải phản hồi dưới 300ms; các truy vấn báo cáo tổng hợp phức tạp không quá 1.5 giây.
- **Khả năng chịu tải đồng thời (Concurrency):** Hệ thống phục vụ tối thiểu 10.000 người dùng hoạt động đồng thời (Concurrent Users) trên cụm máy chủ phân tán mà không suy giảm hiệu năng.
- **Thời gian tải trang Web & App (Page Load Speed):** Chỉ số Largest Contentful Paint (LCP) dưới 2.0 giây, First Input Delay (FID) dưới 100ms trên kết nối 4G tiêu chuẩn.

#### 4.2 Bảo Mật & Tuân Thủ (Security & Compliance)
- **Mã hóa dữ liệu (Data Encryption):** Dữ liệu lưu trữ (Data-at-rest) được mã hóa bằng chuẩn AES-256; dữ liệu đường truyền (Data-in-transit) bắt buộc mã hóa qua giao thức TLS 1.3 / HTTPS.
- **Phòng chống tấn công an ninh mạng:** Tích hợp bộ lọc WAF phòng chống 100% các lỗ hổng OWASP Top 10 (SQL Injection, XSS, CSRF, SSRF, Broken Authentication).
- **Chính sách mật khẩu & Phiên làm việc:** Mật khẩu băm qua thuật toán bcrypt (cost factor 10); phiên đăng nhập JWT hết hạn sau 60 phút, tự động làm mới qua Refresh Token.

#### 4.3 Tính Khả Dụng & Trải Nghiệm (Usability)
- **Thiết kế giao diện:** Tuân thủ tiêu chuẩn giao diện thượng lưu Dark Obsidian & Champagne Gold, tương thích hoàn hảo từ màn hình máy tính 4K, Laptop đến Smartphone viền mỏng.
- **Khả năng truy cập đa nền tảng:** Hỗ trợ đầy đủ Web Desktop, Mobile App iOS (TestFlight / IPA / WebClip) và Android (APK Standalone).

#### 4.4 Độ Tin Cậy & Khôi Phục Thảm Họa (Reliability & Disaster Recovery)
- **Chỉ số sẵn sàng (High Availability):** Đạt mức Uptime tối thiểu 99.9% (không quá 8.76 giờ gián đoạn/năm).
- **Sao lưu dữ liệu tự động (Backup Policy):** Sao lưu toàn bộ CSDL PostgreSQL mỗi 6 giờ một lần; lưu trữ dự phòng tại hạ tầng đám mây độc lập.
- **Thời gian khôi phục thảm họa (RTO & RPO):** RPO (Mất mát dữ liệu tối đa) ≤ 15 phút; RTO (Thời gian phục hồi dịch vụ) ≤ 30 phút.

---

### PHẦN 5: YÊU CẦU GIAO TIẾP VÀ TÍCH HỢP HỆ THỐNG (SYSTEM INTERFACES)
1. **Cổng Thanh Toán & Ngân Hàng Số VietQR / PayOS:** Tích hợp sinh mã QR thanh toán Napas 24/7 và nhận Webhook thông báo giao dịch tự động gạch nợ trong 1 giây.
2. **Cổng Tin Nhắn SMS OTP & Viễn Thông:** Tích hợp API SMS Brandname của Viettel / FPT / VNPT phục vụ gửi mã xác thực đăng nhập và bảo mật hai lớp.
3. **Dịch Vụ Email SMTP Doanh Nghiệp:** Tích hợp máy chủ SMTP gửi thư chào hàng, hợp đồng kinh tế và hóa đơn điện tử tự động.
4. **Hạ Tầng Lưu Trữ Đối Tượng MinIO / S3:** Lưu trữ phân tán tài liệu doanh nghiệp, ảnh danh thiếp OCR và hợp đồng scan.
5. **Cổng Tích Hợp Trí Tuệ Nhân Tạo AI Copilot:** Kết nối mô hình ngôn ngữ lớn (LLM OpenAI / Gemini / Ollama) xử lý đàm thoại điều hành và OCR tài liệu.
`;

const mdFile = path.join(docDir, 'SRS_CHI_TIET_VIONE_HE_THONG_TOAN_DIEN.md');
fs.writeFileSync(mdFile, mdContent, 'utf8');
console.log('  -> Da luu file Markdown SRS tai:', mdFile);

// 2. Tạo bản Word DOCX cực kỳ chi tiết chuẩn quốc tế
console.log('>>> [2] Tao ban Word (.docx) SRS sieu chi tiet...');
const docSections = [];

// Header trang bìa
docSections.push(
  new Paragraph({
    text: "HỆ THỐNG DOANH NGHIỆP TOÀN DIỆN VIONE & MẠNG XÃ HỘI DOANH NHÂN B2B",
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 }
  }),
  new Paragraph({
    text: "TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) CHUẨN QUỐC TẾ IEEE 830",
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 }
  }),
  new Paragraph({
    children: [
      new TextRun({ text: "Mã tài liệu: ", bold: true }),
      new TextRun("SRS-VIONE-MASTER-6.0 | "),
      new TextRun({ text: "Phiên bản: ", bold: true }),
      new TextRun("6.0 Enterprise | "),
      new TextRun({ text: "Ngày phát hành: ", bold: true }),
      new TextRun("05/10/2026\n"),
      new TextRun({ text: "Tác giả: ", bold: true }),
      new TextRun("Senior Business Analyst & Solution Architect Team (15 năm kinh nghiệm)\n"),
      new TextRun({ text: "Nguyên tắc thiết kế: ", bold: true }),
      new TextRun("MECE (Mutually Exclusive, Collectively Exhaustive) - Phân rã triệt để không bỏ sót chức năng.")
    ],
    spacing: { after: 400 }
  })
);

// Phần I, II
docSections.push(
  new Paragraph({ text: "PHẦN 1: GIỚI THIỆU CHUNG (INTRODUCTION)", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } }),
  new Paragraph({ text: "Tài liệu SRS này đặc tả chi tiết toàn bộ yêu cầu kỹ thuật và nghiệp vụ của dự án ViOne bao gồm 21 phân hệ Web CRM và 12 phân hệ Mobile App Native & PWA (tổng cộng 33 phân hệ toàn diện), làm căn cứ nghiệm thu và bàn giao hệ thống." }),
  new Paragraph({ text: "PHẦN 2: MÔ TẢ TỔNG QUAN VÀ DANH SÁCH USER ROLES", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } }),
  new Paragraph({ text: "Hệ thống phân định 7 nhóm quyền người dùng rõ ràng: System Admin, CEO, COO, CFO, Sales Manager, Staff và Member/Partner, tương ứng với 5 User Journey trọn vẹn từ lúc tiếp cận đến khi kết thúc giao dịch." }),
  new Paragraph({ text: "PHẦN 3: ĐẶC TẢ YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS)", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } })
);

// Bảng chi tiết từng Module
srsModules.forEach(mod => {
  docSections.push(
    new Paragraph({
      text: `MODULE ${mod.moduleNumber}: ${mod.moduleName.toUpperCase()}`,
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 250, after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Mục tiêu Epic: ", bold: true }),
        new TextRun(mod.epic)
      ],
      spacing: { after: 150 }
    })
  );

  const tableRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: "Mã FR & Tên Chức Năng", bold: true })], width: { size: 30, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ text: "Đặc Tả Kỹ Thuật (Actor, Input, Logic 5 Bước, Output, Exception & API)", bold: true })], width: { size: 70, type: WidthType.PERCENTAGE } })
      ]
    })
  ];

  mod.features.forEach(f => {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({ text: f.id, bold: true }),
              new Paragraph({ text: f.name }),
              new Paragraph({ text: `Actor: ${f.actor}`, spacing: { before: 50 } }),
              new Paragraph({ text: `API: ${f.api}`, spacing: { before: 50 } })
            ]
          }),
          new TableCell({
            children: [
              new Paragraph({ children: [new TextRun({ text: "Input: ", bold: true }), new TextRun(f.input)] }),
              new Paragraph({ children: [new TextRun({ text: "Logic Xử Lý:\n", bold: true }), new TextRun(f.logic)], spacing: { before: 50 } }),
              new Paragraph({ children: [new TextRun({ text: "Output: ", bold: true }), new TextRun(f.output)], spacing: { before: 50 } }),
              new Paragraph({ children: [new TextRun({ text: "Luồng Ngoại Lệ: ", bold: true }), new TextRun(f.exception)], spacing: { before: 50 } })
            ]
          })
        ]
      })
    );
  });

  docSections.push(
    new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE }
    })
  );
});

// Phần IV, V
docSections.push(
  new Paragraph({ text: "PHẦN 4: YÊU CẦU PHI CHỨC NĂNG (NFR)", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } }),
  new Paragraph({ text: "Hiệu năng: API response < 300ms, tải đồng thời 10.000 users. Bảo mật: Mã hóa AES-256 dữ liệu lưu trữ, TLS 1.3, chống OWASP Top 10. Độ tin cậy: Uptime 99.9%, RPO < 15 phút, RTO < 30 phút." }),
  new Paragraph({ text: "PHẦN 5: GIAO TIẾP VÀ TÍCH HỢP HỆ THỐNG (SYSTEM INTERFACES)", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } }),
  new Paragraph({ text: "Tích hợp đa kênh: VietQR Napas 24/7 gạch nợ tự động, Cổng SMS Brandname OTP, SMTP Mail server, MinIO S3 Object Storage và mô hình trí tuệ nhân tạo AI Copilot LLM." })
);

const doc = new Document({
  sections: [{
    properties: {},
    children: docSections
  }]
});

const docxFile = path.join(docDir, 'SRS_CHI_TIET_VIONE_HE_THONG_TOAN_DIEN.docx');
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(docxFile, buffer);
  console.log('  -> Da xuat ban file Word (.docx) SRS tai:', docxFile);

  // Copy sang public docs
  fs.copyFileSync(mdFile, path.join(publicDocsDir, 'SRS_CHI_TIET_VIONE_HE_THONG_TOAN_DIEN.md'));
  fs.copyFileSync(docxFile, path.join(publicDocsDir, 'SRS_CHI_TIET_VIONE_HE_THONG_TOAN_DIEN.docx'));
  console.log('>>> [SRS VIONE SUPER MASTER 6.0] Da copy sang public/docs. HOAN TAT 100%!');
}).catch(err => {
  console.error('Loi khi tao DOCX SRS:', err);
});
