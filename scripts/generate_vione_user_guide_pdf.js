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

async function generateUserGuidePdf() {
  console.log('=== GENERATING VIONE USER GUIDE (HTML & PDF) ===');

  const guideSections = [
    {
      id: 'SEC-CRM-01',
      title: '1. ĐĂNG NHẬP HỆ THỐNG QUẢN TRỊ DOANH NGHIỆP VIONE WEB CRM',
      system: 'Web CRM ViOne Enterprise',
      url: 'https://14.225.217.232:5445/auth',
      actor: 'Tổng Giám Đốc (CEO), Quản Trị Viên, Kế Toán Trưởng, Quản Lý Nhân Sự',
      purpose: 'Xác thực định danh người dùng quản trị an toàn qua giao diện chuyên biệt, hỗ trợ cơ chế bảo mật đa lớp và điều hướng tự động theo vai trò.',
      steps: [
        'Bước 1: Mở trình duyệt web và truy cập địa chỉ https://14.225.217.232:5445/auth.',
        'Bước 2: Nhập địa chỉ Email quản trị (ví dụ: admin@connect.vn) và Mật khẩu bảo mật.',
        'Bước 3: Nhấn nút "Đăng nhập" để hệ thống kiểm tra thông tin và cấp phiên làm việc JWT an toàn.',
        'Bước 4: Sau khi đăng nhập thành công, hệ thống tự động chuyển hướng trực tiếp vào Trung tâm Điều hành Dashboard.'
      ],
      image: 'vione_crm_01_login.png',
      caption: 'Hình 1.1: Giao diện Màn hình Đăng nhập Quản trị Hệ thống Web CRM ViOne Enterprise'
    },
    {
      id: 'SEC-CRM-02',
      title: '2. TRUNG TÂM ĐIỀU HÀNH C-LEVEL & PHÂN TÍCH TÀI CHÍNH TỔNG QUAN',
      system: 'Web CRM ViOne Enterprise',
      url: 'https://14.225.217.232:5445/dashboard',
      actor: 'Tổng Giám Đốc (CEO), Giám Đốc Tài Chính (CFO), Ban Giám Đốc',
      purpose: 'Trực quan hóa tức thời các chỉ số sống còn của doanh nghiệp: Doanh thu thực thu, Công nợ khách hàng, Số lượng thành viên doanh nghiệp/đối tác kết nối và Chỉ số tiến độ quy trình.',
      steps: [
        'Bước 1: Từ menu bên trái, chọn mục "Tổng quan" (/dashboard).',
        'Bước 2: Lựa chọn bộ lọc chu kỳ thời gian (Tháng này / Quý này / Năm nay) ở góc trên bên phải.',
        'Bước 3: Theo dõi 4 thẻ chỉ số KPI chính: Tổng Doanh Thu, Tăng Trưởng Doanh Số, Số Đối Tác Kết Nối, Tỷ Lệ Hoàn Thành Task.',
        'Bước 4: Rà soát biểu đồ cột doanh thu theo từng tháng và đồ thị phễu cơ hội giao thương B2B.'
      ],
      image: 'vione_crm_02_dashboard_kpi.png',
      caption: 'Hình 1.2: Trung tâm Điều hành C-Level Dashboard với các thẻ chỉ số KPI và biểu đồ phân tích thời gian thực'
    },
    {
      id: 'SEC-CRM-03',
      title: '3. QUẢN LÝ DANH BẠ thành viên doanh nghiệp & đối tác & ĐỐI TÁC B2B',
      system: 'Web CRM ViOne Enterprise',
      url: 'https://14.225.217.232:5445/members',
      actor: 'Quản Lý thành viên doanh nghiệp, Giám Đốc Kinh Doanh, Ban Thư Ký',
      purpose: 'Quản lý toàn bộ hồ sơ các nhà lãnh đạo doanh nghiệp, phân loại ngành nghề, trạng thái xác thực và lịch sử kết nối kinh doanh.',
      steps: [
        'Bước 1: Nhấn chọn mục "thành viên doanh nghiệp & Đối tác" (/members) trên thanh điều hướng.',
        'Bước 2: Sử dụng thanh tìm kiếm đa năng để tra cứu theo Tên doanh nhân, Tên công ty hoặc Số điện thoại.',
        'Bước 3: Lọc theo ngành nghề (Công nghệ, Tài chính, Xây dựng, Bất động sản, Dịch vụ).',
        'Bước 4: Nhấp vào từng dòng thành viên để mở Drawer chi tiết hồ sơ pháp nhân và phân quyền vai trò.'
      ],
      image: 'vione_crm_03_members_directory.png',
      caption: 'Hình 1.3: Danh bạ thành viên doanh nghiệp & đối tác & Đối tác B2B với bộ lọc đa tiêu chí và trạng thái xác thực'
    },
    {
      id: 'SEC-CRM-04',
      title: '4. CHI TIẾT HỒ SƠ PHÁP NHÂN & DUYỆT THÀNH VIÊN DOANH NGHIỆP',
      system: 'Web CRM ViOne Enterprise',
      url: 'https://14.225.217.232:5445/members',
      actor: 'Quản Trị Viên, Ban Thẩm Định Pháp Lý',
      purpose: 'Kiểm tra thông tin giấy phép kinh doanh, mã số thuế, chức vụ đại diện và thực hiện kích hoạt tài khoản hoặc phân quyền.',
      steps: [
        'Bước 1: Trong bảng danh sách thành viên doanh nghiệp, bấm nút "Chi tiết" tại hàng đối tác cần kiểm tra.',
        'Bước 2: Drawer trượt từ cạnh phải hiển thị: Họ tên, Ảnh đại diện, Công ty đại diện, Mã số thuế, Email, Số điện thoại.',
        'Bước 3: Kiểm tra tính hợp lệ của hồ sơ pháp nhân và hạn mức quyền lợi.',
        'Bước 4: Nhấn nút "Phê duyệt kích hoạt" hoặc "Gán vai trò Ban Điều Hành" theo quy định.'
      ],
      image: 'vione_crm_04_member_detail_drawer.png',
      caption: 'Hình 1.4: Drawer Chi tiết Hồ sơ Pháp nhân Doanh nhân kèm tính năng Phê duyệt & Phân quyền RBAC'
    },
    {
      id: 'SEC-CRM-05',
      title: '5. QUẢN TRỊ TỔ CHỨC ĐA DOANH NGHIỆP (MULTI-TENANT ARCHITECTURE)',
      system: 'Web CRM ViOne Enterprise',
      url: 'https://14.225.217.232:5445/companies',
      actor: 'Tổng Giám Đốc, Quản Trị Hệ Thống Tập Đoàn',
      purpose: 'Quản lý danh sách các công ty con, công ty thành viên trong tập đoàn, đảm bảo dữ liệu được phân lập độc lập hoàn toàn theo tenant_id.',
      steps: [
        'Bước 1: Chọn menu "Doanh nghiệp" (/companies).',
        'Bước 2: Xem danh sách các công ty thành viên, mã số thuế, đại diện pháp luật và số lượng nhân sự.',
        'Bước 3: Nhấn nút "Thêm doanh nghiệp" để khởi tạo một không gian làm việc (tenant) mới.',
        'Bước 4: Cấu hình thông tin tài khoản ngân hàng thụ hưởng và phân bổ hạn mức chi tiêu cho từng công ty.'
      ],
      image: 'vione_crm_05_companies_multi_tenant.png',
      caption: 'Hình 1.5: Giao diện Quản trị Đa Doanh Nghiệp (Multi-Tenant) cô lập an toàn từng pháp nhân'
    },
    {
      id: 'SEC-CRM-06',
      title: '6. SÀN CƠ HỘI GIAO THƯƠNG & PHỄU CHUYỂN ĐỔI B2B MATCHMAKING',
      system: 'Web CRM ViOne Enterprise',
      url: 'https://14.225.217.232:5445/opportunities',
      actor: 'Giám Đốc Kinh Doanh (CCO), Trưởng Phòng Phát Triển Đối Tác',
      purpose: 'Vận hành sàn kết nối giao thương giữa các doanh nghiệp thành viên, theo dõi tiến độ các thương vụ từ lúc mở cơ hội đến khi ký kết hợp đồng.',
      steps: [
        'Bước 1: Truy cập phân hệ "Cơ hội giao thương" (/opportunities).',
        'Bước 2: Theo dõi các cột trạng thái phễu: "Nhu cầu mới", "Đang thẩm định", "Khớp lệnh B2B", "Ký kết thành công".',
        'Bước 3: Nhấn "Đăng cơ hội mới" để đưa nhu cầu mua sắm thiết bị hoặc tìm đối tác liên danh lên sàn.',
        'Bước 4: Hệ thống tự động kích hoạt thuật toán AI Matchmaking để gợi ý 3 đối tác có năng lực cung ứng phù hợp nhất.'
      ],
      image: 'vione_crm_06_opportunities_b2b.png',
      caption: 'Hình 1.6: Phễu Sàn Cơ hội Giao thương B2B và quản lý tiến độ khớp lệnh hợp đồng giữa các doanh nghiệp'
    },
    {
      id: 'SEC-CRM-07',
      title: '7. QUẢN TRỊ SỰ KIỆN DOANH NHÂN & SƠ ĐỒ CHỖ NGỒI CINEMA SEATING',
      system: 'Web CRM ViOne Enterprise',
      url: 'https://14.225.217.232:5445/events',
      actor: 'Ban Tổ Chức Sự Kiện, Giám Đốc Truyền Thông',
      purpose: 'Lên kế hoạch tổ chức đại hội cổ đông, hội thảo xúc tiến thương mại, thiết lập sơ đồ ghế ngồi rạp chiếu và phát hành mã vé QR.',
      steps: [
        'Bước 1: Truy cập mục "Sự kiện" (/events) trên thanh menu.',
        'Bước 2: Nhấn nút "Tạo sự kiện mới" để mở form thiết lập thông số hội thảo.',
        'Bước 3: Điền Tiêu đề, Thời gian diễn ra, Địa điểm tổ chức, Số lượng vé tối đa và Đơn giá vé (nếu có thu phí).',
        'Bước 4: Cấu hình sơ đồ phân hạng ghế (Khu vực VIP, Khu vực Tiêu chuẩn) và phát hành vé điện tử.'
      ],
      image: 'vione_crm_07_events_management.png',
      caption: 'Hình 1.7: Bảng quản lý Danh sách Sự kiện B2B, Hội nghị Doanh nhân và Hội thảo Xúc tiến'
    },
    {
      id: 'SEC-CRM-08',
      title: '8. KHỞI TẠO SỰ KIỆN & THIẾT LẬP VÉ ĐIỆN TỬ CHECK-IN QR',
      system: 'Web CRM ViOne Enterprise',
      url: 'https://14.225.217.232:5445/events',
      actor: 'Điều Phối Viên Sự Kiện',
      purpose: 'Thao tác tạo mới sự kiện qua cửa sổ pop-up chuyên dụng, thiết lập giá vé và sơ đồ check-in.',
      steps: [
        'Bước 1: Trong màn hình sự kiện, nhấn nút "Tạo sự kiện" (nút vàng góc phải).',
        'Bước 2: Cửa sổ Modal hiển thị đầy đủ các trường nhập liệu: Tên sự kiện, Banner, Thời gian bắt đầu/kết thúc.',
        'Bước 3: Bật tùy chọn "Sự kiện có thu phí" nếu muốn tích hợp thanh toán VietQR tự động.',
        'Bước 4: Nhấn "Lưu & Xuất bản sự kiện" để gửi thông báo mời tham dự tới toàn thể doanh nhân trên App Mobile.'
      ],
      image: 'vione_crm_08_event_create_modal.png',
      caption: 'Hình 1.8: Cửa sổ Modal Khởi tạo Sự kiện Doanh nhân mới và thiết lập vé điện tử QR Code'
    },
    {
      id: 'SEC-CRM-09',
      title: '9. SÀN SHOWCASE SẢN PHẨM & E-CATALOG GIẢI PHÁP DOANH NGHIỆP',
      system: 'Web CRM ViOne Enterprise',
      url: 'https://14.225.217.232:5445/products',
      actor: 'Giám Đốc Sản Phẩm, Đại Diện Doanh Nghiệp Cung Ứng',
      purpose: 'Giới thiệu các sản phẩm, giải pháp và dịch vụ chủ lực của doanh nghiệp đến toàn thể cộng đồng C-Level trong hệ sinh thái.',
      steps: [
        'Bước 1: Chọn menu "Sản phẩm / Dịch vụ" (/products).',
        'Bước 2: Xem lưới sản phẩm trực quan với ảnh sắc nét, tên giải pháp, giá niêm yết và chiết khấu nội bộ.',
        'Bước 3: Nhấn "Thêm sản phẩm mới" để tải lên hình ảnh minh họa, thông số kỹ thuật và chính sách bảo hành.',
        'Bước 4: Nhấn nút kiểm duyệt để xuất bản giải pháp lên sàn giao thương B2B toàn quốc.'
      ],
      image: 'vione_crm_09_products_marketplace.png',
      caption: 'Hình 1.9: Sàn Sản phẩm & E-Catalog Giải pháp Doanh nghiệp B2B Showcase'
    },
    {
      id: 'SEC-CRM-10',
      title: '10. QUẢN TRỊ QUY TRÌNH NGHIỆP VỤ BPMN 2.0 & TIẾN ĐỘ KANBAN',
      system: 'Web CRM ViOne Enterprise',
      url: 'https://14.225.217.232:5445/workflow',
      actor: 'Trưởng Phòng Vận Hành, Quản Lý Dự Án, Kỹ Sư Trưởng',
      purpose: 'Quản lý toàn bộ vòng đời thực hiện công việc theo tiêu chuẩn BPMN 2.0, kiểm soát chặt chẽ tỷ lệ nghiệm thu qua checklist và phát hiện ngay các điểm nghẽn.',
      steps: [
        'Bước 1: Nhấn vào mục "Quy trình & Vận hành" -> "BPMN Workflow" (/workflow).',
        'Bước 2: Quan sát 4 cột Kanban: "Cần làm (To Do)", "Đang làm (In Progress)", "Đang duyệt (Review)", "Hoàn thành (Done)".',
        'Bước 3: Kéo thả thẻ công việc giữa các cột theo tiến độ thực tế.',
        'Bước 4: Lưu ý quy tắc BR-WRK-07: Hệ thống chặn tuyệt đối việc kéo sang "Done" nếu checklist nghiệm thu chưa tích đủ 100%.'
      ],
      image: 'vione_crm_10_workflow_bpmn.png',
      caption: 'Hình 1.10: Bảng Quản trị Quy trình BPMN 2.0 Kanban với kiểm soát giới hạn WIP và cảnh báo đỏ quá hạn'
    },
    {
      id: 'SEC-CRM-10B',
      title: '11. FORM KHỞI TẠO TASK BPMN & THIẾT LẬP CHECKLIST NGHIỆM THU',
      system: 'Web CRM ViOne Enterprise',
      url: 'https://14.225.217.232:5445/workflow',
      actor: 'Project Manager, Team Leader',
      purpose: 'Thiết lập chi tiết đầu việc, chỉ định người thực hiện, thời hạn cam kết SLA và các tiêu chí nghiệm thu bắt buộc.',
      steps: [
        'Bước 1: Tại màn hình Workflow, nhấn nút "+ Tạo công việc mới".',
        'Bước 2: Nhập Tiêu đề công việc, Mô tả chi tiết, Gán nhân viên phụ trách (Assignee) và chọn Deadline.',
        'Bước 3: Thêm các mục checklist nghiệm thu (ví dụ: 1. Khảo sát; 2. Thiết kế; 3. Lập trình; 4. Kiểm thử; 5. Ký biên bản).',
        'Bước 4: Nhấn "Lưu công việc" để hệ thống tạo thẻ task và gửi thông báo tức thời đến nhân viên phụ trách.'
      ],
      image: 'vione_crm_10b_task_create_modal.png',
      caption: 'Hình 1.11: Cửa sổ Modal Tạo mới Task BPMN 2.0 với danh mục tiêu chuẩn nghiệm thu Checklist 100%'
    },
    {
      id: 'SEC-CRM-11',
      title: '12. WORKLOAD HEATMAP - GIÁM SÁT TẢI NHÂN SỰ & CẢNH BÁO QUÁ TẢI >45H',
      system: 'Web CRM ViOne Enterprise',
      url: 'https://14.225.217.232:5445/workload',
      actor: 'Giám Đốc Nhân Sự (CHRO), Trưởng Bộ Phận, CEO',
      purpose: 'Thấu suốt giờ làm việc thực tế của từng nhân viên trong tuần, kịp thời phát hiện nguy cơ kiệt sức do quá tải hoặc lãng phí nguồn lực để tái phân bổ.',
      steps: [
        'Bước 1: Mở mục "Tải công việc" (/workload) trên thanh điều hướng.',
        'Bước 2: Xem ma trận Heatmap hiển thị danh sách nhân sự ở trục dọc và các ngày trong tuần ở trục ngang.',
        'Bước 3: Kiểm tra màu sắc các ô: Xanh lá (tải tối ưu 35-40h), Vàng (tải cao 40-45h), Đỏ phát sáng (quá tải > 45h/tuần theo BR-WRK-14).',
        'Bước 4: Sử dụng tính năng "Gợi ý điều chuyển" để chuyển bớt đầu việc sang nhân sự đang có tải < 30h.'
      ],
      image: 'vione_crm_11_workload_matrix.png',
      caption: 'Hình 1.12: Ma trận Workload Heatmap theo dõi giờ làm việc tuần của từng nhân sự kèm cảnh báo đỏ quá tải >45h'
    },
    {
      id: 'SEC-CRM-12',
      title: '13. GIÁM SÁT CHẤM CÔNG THỜI GIAN THỰC GPS <=50M & AI FACEID',
      system: 'Web CRM ViOne Enterprise',
      url: 'https://14.225.217.232:5445/attendance',
      actor: 'Quản Lý Nhân Sự, Trưởng Phòng Hành Chính, Ban Điều Hành',
      purpose: 'Giám sát tính tuân thủ chấm công của toàn bộ đội ngũ, xác thực tọa độ GPS trong bán kính quy định và nhận diện khuôn mặt chống gian lận.',
      steps: [
        'Bước 1: Chọn menu "Chấm công & Nhân sự" (/attendance).',
        'Bước 2: Bảng công thời gian thực hiển thị: Họ tên, Phòng ban, Giờ Check-in, Giờ Check-out, Tọa độ GPS, Độ tin cậy FaceID.',
        'Bước 3: Nhấp vào từng bản ghi để xem ảnh chụp khuôn mặt và vị trí bản đồ vệ tinh GPS.',
        'Bước 4: Thực hiện duyệt các đơn xin nghỉ phép, làm việc từ xa (WFH) hoặc đơn đăng ký tăng ca OT chỉ bằng 1 cú nhấp chuột.'
      ],
      image: 'vione_crm_12_attendance_gps_faceid.png',
      caption: 'Hình 1.13: Bảng Giám sát Chấm công Thời gian thực GPS bán kính <=50m và đối soát AI FaceID Liveness >=92%'
    },
    {
      id: 'SEC-CRM-13',
      title: '14. PHÊ DUYỆT CHI 3 CẤP MAKER-CHECKER-APPROVER & VIETQR 24/7',
      system: 'Web CRM ViOne Enterprise',
      url: 'https://14.225.217.232:5445/payment-approvals',
      actor: 'Nhân Viên (Maker), Kế Toán Trưởng (Checker), Tổng Giám Đốc (Approver)',
      purpose: 'Thiết lập quy trình kiểm soát chi tiêu chặt chẽ, loại bỏ hoàn toàn tình trạng chi khống, chi vượt thẩm quyền và thanh toán tức thì qua mã VietQR Napas.',
      steps: [
        'Bước 1: Truy cập mục "Phê duyệt tài chính" (/payment-approvals).',
        'Bước 2: Theo dõi danh sách tờ trình phân loại theo 3 trạng thái: "Chờ thẩm định", "Chờ CEO phê duyệt", "Đã thanh toán".',
        'Bước 3: Kế toán trưởng rà soát chứng từ, hóa đơn VAT và nhấn "Thẩm định đạt (Checker Pass)".',
        'Bước 4: Tổng Giám Đốc ký duyệt điện tử các khoản chi > 20 triệu VNĐ (BR-FIN-02), hệ thống lập tức xuất mã VietQR thanh toán gạch nợ 1 giây.'
      ],
      image: 'vione_crm_13_payment_approvals_3tier.png',
      caption: 'Hình 1.14: Bảng Quản trị Luồng Phê duyệt Chi tiêu Doanh nghiệp 3 cấp (Maker - Checker - Approver)'
    },
    {
      id: 'SEC-CRM-13B',
      title: '15. FORM LẬP TỜ TRÌNH CHI & KHỬ TRÙNG HÓA ĐƠN VAT CHỐNG CHI TRÙNG',
      system: 'Web CRM ViOne Enterprise',
      url: 'https://14.225.217.232:5445/payment-approvals',
      actor: 'Nhân viên đề xuất chi (Maker)',
      purpose: 'Tạo phiếu đề xuất thanh toán kinh phí kèm thông tin số hóa đơn tài chính và tài khoản thụ hưởng.',
      steps: [
        'Bước 1: Nhấn nút "+ Tạo tờ trình chi mới" tại màn hình Phê duyệt.',
        'Bước 2: Nhập Nội dung chi tiêu, Số tiền thanh toán, Tên bên thụ hưởng, Số tài khoản ngân hàng và Ngân hàng nhận.',
        'Bước 3: Nhập Số hóa đơn VAT và tải lên ảnh chụp hóa đơn điện tử.',
        'Bước 4: Nhấn "Gửi tờ trình". Hệ thống tự động kiểm tra số hóa đơn (BR-FIN-07) để ngăn chặn lập phiếu chi trùng lặp.'
      ],
      image: 'vione_crm_13b_approval_create_modal.png',
      caption: 'Hình 1.15: Cửa sổ Modal Lập Tờ trình Chi tiêu Doanh nghiệp và kiểm tra khử trùng Hóa đơn VAT'
    },
    {
      id: 'SEC-CRM-14',
      title: '16. QUẢN LÝ SỔ QUỸ THU TIỀN MẶT & TÀI KHOẢN NGÂN HÀNG',
      system: 'Web CRM ViOne Enterprise',
      url: 'https://14.225.217.232:5445/income',
      actor: 'Thủ Quỹ, Kế Toán Thu Công Nợ, CFO',
      purpose: 'Theo dõi chi tiết các nguồn thu vào doanh nghiệp: Phí thành viên doanh nghiệp thường niên, doanh thu bán vé sự kiện, thu tiền hợp đồng dịch vụ.',
      steps: [
        'Bước 1: Chọn menu "Tài chính" -> "Quản lý nguồn thu" (/income).',
        'Bước 2: Bảng dữ liệu hiển thị từng phiếu thu kèm Mã chứng từ, Ngày thu, Đối tác nộp tiền, Số tiền và Hình thức thanh toán.',
        'Bước 3: Sử dụng bộ lọc theo ngày để đối chiếu khớp đúng với sổ phụ ngân hàng.',
        'Bước 4: Bấm "Xuất sổ quỹ Excel" để phục vụ công tác lập báo cáo tài chính kiểm toán.'
      ],
      image: 'vione_crm_14_income_cashbook.png',
      caption: 'Hình 1.16: Sổ quỹ Quản lý Nguồn thu Doanh nghiệp và đối soát thanh toán điện tử'
    },
    {
      id: 'SEC-CRM-15',
      title: '17. QUẢN LÝ CHI PHÍ DOANH NGHIỆP & PHÂN LOẠI NGÂN SÁCH PHÒNG BAN',
      system: 'Web CRM ViOne Enterprise',
      url: 'https://14.225.217.232:5445/expenses',
      actor: 'Kế Toán Chi, Giám Đốc Tài Chính',
      purpose: 'Kiểm soát chặt chẽ các khoản chi hoạt động (OpEx), chi đầu tư (CapEx) và chi phí tiếp khách của từng phòng ban.',
      steps: [
        'Bước 1: Chọn mục "Chi phí doanh nghiệp" (/expenses).',
        'Bước 2: Tra soát danh sách các phiếu chi đã được CEO phê duyệt và giải ngân.',
        'Bước 3: Kiểm tra phân bổ chi phí theo phòng ban (Kỹ thuật, Kinh doanh, Marketing, Ban Giám đốc).',
        'Bước 4: Đối chiếu hạn mức ngân sách còn lại của tháng để cảnh báo vượt định mức chi tiêu.'
      ],
      image: 'vione_crm_15_expenses_cashbook.png',
      caption: 'Hình 1.17: Sổ quỹ Quản lý Chi phí Doanh nghiệp và phân loại ngân sách phòng ban'
    },
    {
      id: 'SEC-CRM-17',
      title: '18. CẤU HÌNH HỆ THỐNG, BẢO MẬT & NHẬT KÝ KIỂM TOÁN (AUDIT LOGS)',
      system: 'Web CRM ViOne Enterprise',
      url: 'https://14.225.217.232:5445/settings',
      actor: 'Super Administrator, Giám Đốc An Toàn Thông Tin (CISO)',
      purpose: 'Quản trị các tham số toàn cục, thiết lập chính sách mật khẩu, kiểm soát vai trò RBAC và lưu vết mọi hoạt động tác động dữ liệu.',
      steps: [
        'Bước 1: Nhấn vào biểu tượng "Cài đặt hệ thống" (/settings) ở góc trái dưới cùng.',
        'Bước 2: Xem danh mục vai trò người dùng (Roles) và các cờ phân quyền (Permissions).',
        'Bước 3: Mở tab "Audit Logs" để tra soát lịch sử đăng nhập, IP truy cập và các thao tác thêm/sửa/xóa dữ liệu.',
        'Bước 4: Cấu hình khóa tự động phiên làm việc sau 15 phút không hoạt động để bảo vệ an toàn thông tin.'
      ],
      image: 'vione_crm_17_system_settings.png',
      caption: 'Hình 1.18: Giao diện Cài đặt Hệ thống, Phân quyền RBAC và Bảng Nhật ký Kiểm toán Audit Logs bất biến'
    },

    // PHẦN 2: APP VIONE CONNECT
    {
      id: 'SEC-APP-01',
      title: '19. ĐĂNG NHẬP APP VIONE CONNECT - NGÔN NGỮ DARK LUXURY OBSIDIAN',
      system: 'App ViOne Connect Mobile (Native & PWA)',
      url: 'https://14.225.217.232:5445/vione/login',
      actor: 'Doanh Nhân, Lãnh Đạo Doanh Nghiệp, thành viên doanh nghiệp C-Level',
      purpose: 'Màn hình đăng nhập phong cách thượng lưu Obsidian Dark (#0A0A0B) kết hợp Vàng Hoàng Gia (#D8B282), hỗ trợ đăng nhập đa kênh tức thì.',
      steps: [
        'Bước 1: Mở ứng dụng ViOne Connect trên điện thoại hoặc truy cập /vione/login trên trình duyệt mobile.',
        'Bước 2: Chiêm ngưỡng giao diện đẳng cấp với ảnh nền connect-auth-bg.jpg phủ vignette và logo vương miện hoàng gia.',
        'Bước 3: Chọn đăng nhập nhanh bằng tài khoản Google, Apple hoặc nhập Email & Mật khẩu doanh nhân.',
        'Bước 4: Có thể chạm thẻ danh thiếp vật lý NFC vào mặt lưng điện thoại để đăng nhập xác thực tự động không cần gõ phím.'
      ],
      image: 'vione_app_01_login_luxury.png',
      caption: 'Hình 2.1: Màn hình Đăng nhập App ViOne Connect chuẩn Dark Luxury Obsidian & Bronze Gold'
    },
    {
      id: 'SEC-APP-02',
      title: '20. TRANG CHỦ ĐIỀU HÀNH EXECUTIVE HOME & THẺ DOANH NHÂN B2B',
      system: 'App ViOne Connect Mobile',
      url: 'https://14.225.217.232:5445/connect-app',
      actor: 'Doanh Nhân, Lãnh Đạo Doanh Nghiệp',
      purpose: 'Không gian làm việc di động tập trung: Thẻ định danh doanh nhân B2B, lịch trình làm việc trong ngày và các lối tắt nhanh.',
      steps: [
        'Bước 1: Sau khi đăng nhập, ứng dụng mở thẳng vào trang chủ Executive Home (/connect-app).',
        'Bước 2: Header hiển thị logo ViOne mạ vàng cùng lời chào theo buổi thời gian thực và chuông thông báo có huy hiệu đỏ.',
        'Bước 3: Thẻ định danh doanh nhân nổi bật với cover vba-hero.jpg, huy hiệu "DOANH NHÂN VIONE" và avatar tròn viền vàng đôi.',
        'Bước 4: Nhấn biểu tượng bút chì để chỉnh sửa thông tin hồ sơ doanh nghiệp hoặc cập nhật chức danh.'
      ],
      image: 'vione_app_02_executive_home.png',
      caption: 'Hình 2.2: Trang chủ Điều hành Executive Home với Thẻ Định danh Doanh nhân B2B Cover sang trọng'
    },
    {
      id: 'SEC-APP-03',
      title: '21. MENU LỐI TẮT THAO TÁC NHANH V-ACTION SHEET (NÚT V TOÀN CỤC)',
      system: 'App ViOne Connect Mobile',
      url: 'https://14.225.217.232:5445/connect-app',
      actor: 'Doanh Nhân, C-Level Executive',
      purpose: 'Bật nhanh bảng điều khiển các tác vụ thường dùng nhất chỉ bằng 1 chạm vào nút V mạ vàng nổi bật ở giữa thanh điều hướng.',
      steps: [
        'Bước 1: Tại bất kỳ màn hình nào, chạm vào nút V tròn mạ vàng ở trung tâm Bottom Navigation Bar.',
        'Bước 2: Bảng V-Action Sheet trượt mượt mà từ cạnh dưới lên với hiệu ứng mờ kính sang trọng.',
        'Bước 3: Lựa chọn hành động: "Chấm công GPS & AI FaceID", "Quy trình công việc", "Ký duyệt chi 3 cấp", "Chia sẻ danh thiếp", "Quét thẻ NFC/QR".',
        'Bước 4: Chạm ra vùng ngoài hoặc vuốt nhẹ xuống để đóng Action Sheet.'
      ],
      image: 'vione_app_03_quick_action_v.png',
      caption: 'Hình 2.3: Menu Lối tắt Thao tác Nhanh V-Action Sheet kích hoạt từ nút V mạ vàng toàn cục'
    },
    {
      id: 'SEC-APP-04',
      title: '22. LỊCH TRÌNH CÔNG VIỆC 3 TAB & THẺ CƠ HỘI KẾT NỐI TIỀM NĂNG',
      system: 'App ViOne Connect Mobile',
      url: 'https://14.225.217.232:5445/connect-app',
      actor: 'Doanh Nhân, Lãnh Đạo Doanh Nghiệp',
      purpose: 'Theo dõi lịch họp, lịch gặp đối tác 1-1 theo 3 phân đoạn thời gian và tiếp cận ngay 15 cơ hội giao thương B2B được AI gợi ý.',
      steps: [
        'Bước 1: Tại trang chủ Executive Home, cuộn xuống phần "Lịch Trình Công Việc".',
        'Bước 2: Chuyển đổi giữa 3 tab phân đoạn: "Hôm nay", "Sắp tới", "Nhắc lịch" với hiệu ứng viên thuốc Gradient Vàng nổi bật.',
        'Bước 3: Xem chi tiết các cuộc gặp đã lên lịch kèm thời gian và địa điểm.',
        'Bước 4: Chạm vào Thẻ Insight màu vàng hổ phách nhung ("15 cơ hội kết nối tiềm năng cao") để xem danh sách đối tác ghép nối ngay.'
      ],
      image: 'vione_app_04_editorial_schedule_tabs.png',
      caption: 'Hình 2.4: 3 Tab Lịch trình Công việc phân đoạn và Thẻ Cơ hội Kết nối Tiềm năng (Insight Card)'
    },
    {
      id: 'SEC-APP-07',
      title: '23. KHỐI ĐIỀU HÀNH & GIÁM SÁT VẬN HÀNH DOANH NGHIỆP TRÊN MOBILE',
      system: 'App ViOne Connect Mobile',
      url: 'https://14.225.217.232:5445/connect-app',
      actor: 'Tổng Giám Đốc, Quản Lý Vận Hành, Nhân Viên',
      purpose: 'Tích hợp toàn diện 3 trụ cột vận hành doanh nghiệp ngay trên màn hình chính: Chấm công GPS FaceID, Quy trình BPMN & Giám sát tải, Phê duyệt chi 3 cấp.',
      steps: [
        'Bước 1: Tại Executive Home, cuộn xuống khối "GIÁM SÁT VẬN HÀNH & NHÂN SỰ" có đèn xanh nhấp nháy "HOẠT ĐỘNG".',
        'Bước 2: Thẻ 1 "Chấm công GPS & AI FaceID": Chạm vào để mở camera nhận diện khuôn mặt và chấm công trong bán kính <= 50m.',
        'Bước 3: Thẻ 2 "Quy trình & Tiến độ nhân sự": Chạm vào để kiểm tra Kanban việc của tôi và cảnh báo nhân sự quá tải > 45h/tuần.',
        'Bước 4: Thẻ 3 "Phê duyệt chi 3 cấp": Chạm vào để lãnh đạo ký duyệt điện tử các khoản chi và thanh toán qua VietQR 24/7.'
      ],
      image: 'vione_app_07_enterprise_operations_card.png',
      caption: 'Hình 2.5: Khối Giám sát Vận hành & Nhân sự Doanh nghiệp thời gian thực trên App ViOne Connect'
    },
    {
      id: 'SEC-APP-11',
      title: '24. DANH BẠ MẠNG LƯỚI ĐỐI TÁC C-LEVEL & 3 BỘ LỌC KẾT NỐI',
      system: 'App ViOne Connect Mobile',
      url: 'https://14.225.217.232:5445/connect-app/network',
      actor: 'Doanh Nhân, Lãnh Đạo Mở Rộng Đối Tác',
      purpose: 'Mở rộng mạng lưới quan hệ làm ăn với các Tổng Giám Đốc, Chủ tịch HĐQT trong hệ sinh thái, phân loại đối tác thông minh.',
      steps: [
        'Bước 1: Chạm vào tab "Đối tác" (icon hai người) trên thanh điều hướng dưới cùng.',
        'Bước 2: Sử dụng 3 nút lọc nhanh: "Đã kết nối", "Lời mời", "Gợi ý AI".',
        'Bước 3: Duyệt qua các thẻ đối tác hiển thị: Ảnh chân dung, Họ tên, Chức vụ, Công ty và Ngành nghề hoạt động.',
        'Bước 4: Chạm nút biểu tượng tin nhắn (MessageSquare) trên thẻ để mở ngay cuộc trò chuyện trực tiếp 1-1 với đối tác đó.'
      ],
      image: 'vione_app_11_network_partners.png',
      caption: 'Hình 2.6: Danh bạ Mạng lưới Đối tác Doanh nhân C-Level với 3 bộ lọc và nút nhắn tin 1-chạm'
    },
    {
      id: 'SEC-APP-12',
      title: '25. HỘP THƯ TIN NHẮN MESSENGER 4 DANH MỤC & HIỂN THỊ OUTBOX',
      system: 'App ViOne Connect Mobile',
      url: 'https://14.225.217.232:5445/connect-app/inbox',
      actor: 'Doanh Nhân, Ban Điều Hành',
      purpose: 'Kênh đàm phán hợp đồng và trao đổi kinh doanh bảo mật, phân loại 4 nhóm chuẩn Messenger và hiển thị tin nhắn do mình gửi đi.',
      steps: [
        'Bước 1: Tại màn hình Network, chuyển sang phân hệ "Tin nhắn" hoặc truy cập /connect-app/inbox.',
        'Bước 2: Kiểm tra 4 tab phân loại: "Tất cả" (hiển thị cả tin nhắn outbox Bạn: ...), "Chưa đọc", "Nhóm", "Tin nhắn chờ".',
        'Bước 3: Nhấn nút "+ Tạo nhóm" để khởi tạo nhóm thảo luận dự án đầu tư hoặc liên minh C-Level.',
        'Bước 4: Chạm vào một hội thoại bất kỳ để mở khung trò chuyện thời gian thực.'
      ],
      image: 'vione_app_12_messages_inbox.png',
      caption: 'Hình 2.7: Hộp thư Tin nhắn Doanh nhân chuẩn Messenger 4 Danh mục hiển thị tin nhắn outbox và đếm tin mới'
    },
    {
      id: 'SEC-APP-13',
      title: '26. KHUNG CHAT TRỰC TIẾP 1-1 & NHÓM THẢO LUẬN KINH DOANH B2B',
      system: 'App ViOne Connect Mobile',
      url: 'https://14.225.217.232:5445/connect-app/inbox',
      actor: 'Hai hoặc nhiều Doanh nhân đang trao đổi',
      purpose: 'Trò chuyện thời gian thực với phản hồi 0ms (Optimistic UI), bong bóng vàng hổ phách sang trọng, tích hợp chia sẻ cơ hội giao thương.',
      steps: [
        'Bước 1: Mở cuộc trò chuyện từ Hộp thư hoặc từ Thẻ đối tác.',
        'Bước 2: Header hiển thị tên đối tác, ảnh đại diện và chấm xanh báo trạng thái Online.',
        'Bước 3: Gõ nội dung tin nhắn và nhấn nút "Gửi" mạ vàng. Tin nhắn xuất hiện ngay lập tức không có độ trễ.',
        'Bước 4: Tin nhắn do mình gửi có màu vàng hổ phách căn phải, tin nhắn đối tác có màu Slate viền mỏng căn trái.'
      ],
      image: 'vione_app_13_chat_thread.png',
      caption: 'Hình 2.8: Khung Chat Trực tiếp 1-1 và Nhóm Thảo luận Doanh nhân B2B thời gian thực'
    },
    {
      id: 'SEC-APP-14',
      title: '27. DANH THIẾP ĐIỆN TỬ CÁ NHÂN THÔNG MINH VIP CARD 3D & MÃ QR',
      system: 'App ViOne Connect Mobile',
      url: 'https://14.225.217.232:5445/connect-app/card',
      actor: 'thành viên doanh nghiệp & đối tác Sở Hữu Thẻ',
      purpose: 'Thay thế hoàn toàn danh thiếp giấy truyền thống, thể hiện vị thế lãnh đạo với thẻ VIP mạ vàng 3D và chia sẻ thông tin qua mã QR định danh.',
      steps: [
        'Bước 1: Chạm vào tab "Thẻ của tôi" (icon thẻ ID) trên thanh điều hướng dưới cùng.',
        'Bước 2: Thẻ VIP mạ vàng 3D hiển thị bóng bẩy với đầy đủ thông tin: Họ tên, Chức vụ, Công ty, Mã thành viên doanh nghiệp.',
        'Bước 3: Chạm vào nút "Hiện mã QR" để đối tác bật camera điện thoại quét và lưu ngay danh bạ trong 1 giây.',
        'Bước 4: Tùy chỉnh các trường thông tin muốn công khai (Số điện thoại, Zalo, LinkedIn, Website công ty).'
      ],
      image: 'vione_app_14_digital_card_3d.png',
      caption: 'Hình 2.9: Danh thiếp Điện tử Cá nhân Thông minh VIP Card 3D và Mã QR Chia sẻ tức thì'
    },
    {
      id: 'SEC-APP-15',
      title: '28. RADAR CHẠM THẺ NFC - TRAO ĐỔI DANH THIẾP DOANH NHÂN 1-CHẠM',
      system: 'App ViOne Connect Mobile',
      url: 'https://14.225.217.232:5445/connect-app/card',
      actor: 'Doanh Nhân Trang Bị Thẻ Vật Lý NFC ViOne',
      purpose: 'Công nghệ giao tiếp trường gần NFC đẳng cấp, chỉ cần chạm thẻ vào lưng điện thoại đối tác là toàn bộ danh thiếp số được truyền tải ngay.',
      steps: [
        'Bước 1: Tại màn hình Thẻ của tôi, nhấn nút "Chạm thẻ NFC / Bật Radar".',
        'Bước 2: Màn hình hiển thị sóng radar quét vòng tròn tỏa sáng màu vàng đồng.',
        'Bước 3: Đưa thẻ danh thiếp vật lý ViOne kim loại chạm nhẹ vào mặt lưng điện thoại đối tác.',
        'Bước 4: Điện thoại rung nhẹ xác nhận, hồ sơ năng lực doanh nghiệp lập tức mở ra trên màn hình đối tác.'
      ],
      image: 'vione_app_15_nfc_qr_share.png',
      caption: 'Hình 2.10: Màn hình Radar Kích hoạt Chạm Thẻ Danh Thiếp NFC Trao Đổi Quan Hệ Làm Ăn'
    },
    {
      id: 'SEC-APP-16',
      title: '29. B2B MOMENTS - BẢNG TIN GIAO THƯƠNG & CHIA SẺ THƯƠNG VỤ DOANH NHÂN',
      system: 'App ViOne Connect Mobile',
      url: 'https://14.225.217.232:5445/connect-app/moments',
      actor: 'Cộng Đồng Doanh Nhân ViOne Connect',
      purpose: 'Mạng xã hội giao thương B2B khép kín, nơi các lãnh đạo doanh nghiệp chia sẻ hình ảnh lễ ký kết hợp đồng, hoạt động giao lưu và tìm kiếm đối tác mới.',
      steps: [
        'Bước 1: Chạm vào tab "Moments" (icon la bàn / quả cầu) trên thanh điều hướng.',
        'Bước 2: Lướt xem các bài đăng khoảnh khắc kinh doanh từ các Tổng Giám Đốc khác trong cộng đồng.',
        'Bước 3: Thả tim (Like) hoặc để lại lời chúc mừng, đặt câu hỏi hợp tác kinh doanh.',
        'Bước 4: Nhấn nút "+" để chia sẻ hình ảnh thương vụ mới của doanh nghiệp mình lên bảng tin chung.'
      ],
      image: 'vione_app_16_b2b_moments_feed.png',
      caption: 'Hình 2.11: B2B Moments - Bảng tin Giao thương Kết nối Khoảnh khắc Doanh nhân C-Level'
    }
  ];

  // Build HTML
  let html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>TÀI LIỆU HƯỚNG DẪN SỬ DỤNG HỆ SINH THÁI VIONE TOÀN DIỆN</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 15mm 20mm 15mm;
      @bottom-center {
        content: counter(page) " / " counter(pages);
        font-family: 'Times New Roman', serif;
        font-size: 9pt;
        color: #64748B;
      }
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1E293B;
      margin: 0;
      padding: 0;
      background: #FFFFFF;
    }
    .cover-page {
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 90vh;
      text-align: center;
      padding: 40px 20px;
    }
    .cover-tag {
      font-size: 13pt;
      font-weight: bold;
      color: #A67A47;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 20px;
    }
    .cover-title {
      font-size: 26pt;
      font-weight: 800;
      color: #0A0A0B;
      line-height: 1.25;
      margin-bottom: 15px;
      text-transform: uppercase;
    }
    .cover-sub {
      font-size: 14pt;
      font-style: italic;
      color: #64748B;
      margin-bottom: 40px;
      max-width: 600px;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 30px;
      text-align: left;
    }
    .meta-table th, .meta-table td {
      border: 1px solid #CBD5E1;
      padding: 8px 12px;
      font-size: 10.5pt;
    }
    .meta-table th {
      background: #0A0A0B;
      color: #FFFFFF;
      font-weight: bold;
      text-transform: uppercase;
    }
    .meta-table tr:nth-child(even) {
      background: #F8FAFC;
    }
    .section-card {
      page-break-inside: avoid;
      margin-bottom: 30px;
      border-bottom: 1px solid #E2E8F0;
      padding-bottom: 25px;
    }
    .sec-title {
      font-size: 15pt;
      font-weight: bold;
      color: #0A0A0B;
      margin-top: 20px;
      margin-bottom: 8px;
      border-left: 5px solid #D8B282;
      padding-left: 12px;
    }
    .badge {
      display: inline-block;
      font-size: 9pt;
      font-weight: bold;
      padding: 3px 8px;
      border-radius: 4px;
      margin-right: 8px;
      background: #FEF3C7;
      color: #92400E;
      border: 1px solid #FDE68A;
    }
    .badge-sys {
      background: #E0E7FF;
      color: #3730A3;
      border: 1px solid #C7D2FE;
    }
    .info-box {
      background: #F8FAFC;
      border-left: 4px solid #94A3B8;
      padding: 10px 14px;
      margin: 10px 0 14px 0;
      font-size: 10.5pt;
    }
    .steps-list {
      margin: 10px 0 16px 20px;
      padding: 0;
    }
    .steps-list li {
      margin-bottom: 6px;
      font-size: 10.5pt;
    }
    .img-wrapper {
      text-align: center;
      margin: 14px 0;
      page-break-inside: avoid;
    }
    .img-wrapper img {
      max-width: 95%;
      max-height: 480px;
      object-fit: contain;
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    .img-caption {
      font-size: 9.5pt;
      font-style: italic;
      color: #475569;
      margin-top: 6px;
    }
    .header-footer-note {
      font-size: 9pt;
      color: #94A3B8;
      text-align: right;
      border-bottom: 1px solid #E2E8F0;
      padding-bottom: 4px;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div class="cover-tag">TÀI LIỆU VẬN HÀNH & HƯỚNG DẪN NGƯỜI DÙNG CHÍNH THỨC</div>
    <div class="cover-title">HƯỚNG DẪN SỬ DỤNG HỆ SINH THÁI VIONE TOÀN DIỆN</div>
    <div class="cover-sub">Bao Gồm Hệ Thống Quản Trị Doanh Nghiệp ViOne Web CRM & Ứng Dụng Di Động ViOne Connect (Đầy Đủ 100% Ảnh Thao Tác Thực Tế)</div>

    <table class="meta-table">
      <tr>
        <th style="width: 30%;">Thuộc Tính Quản Trị</th>
        <th style="width: 70%;">Nội Dung Quy Chuẩn</th>
      </tr>
      <tr>
        <td><strong>Mã Tài Liệu</strong></td>
        <td>HDSD-VIONE-ENTERPRISE-TOAN-DIEN-V5.0</td>
      </tr>
      <tr>
        <td><strong>Phiên Bản</strong></td>
        <td>Version 5.0 (Bản Chuẩn Hóa Toàn Diện Master BA & QA)</td>
      </tr>
      <tr>
        <td><strong>Nền Tảng Áp Dụng</strong></td>
        <td>Web CRM Enterprise (Desktop) & App ViOne Connect (iOS / Android / PWA)</td>
      </tr>
      <tr>
        <td><strong>Cơ Quan Ban Hành</strong></td>
        <td>Ban Công Nghệ & Khối Vận Hành ViOne Corporation</td>
      </tr>
      <tr>
        <td><strong>Địa Chỉ Trực Tuyến Live</strong></td>
        <td>Web CRM: https://14.225.217.232:5445 | Mobile App: https://14.225.217.232:5445/connect-app</td>
      </tr>
      <tr>
        <td><strong>Tài Khoản Quản Trị Kiểm Thử</strong></td>
        <td>admin@connect.vn / 123456</td>
      </tr>
    </table>
  </div>

  <div class="header-footer-note">Hệ Thống ViOne Enterprise CRM & ViOne Connect App | Tài Liệu Hướng Dẫn Sử Dụng Chính Thức v5.0</div>
`;

  // Append each section with exact matching screenshot!
  for (const sec of guideSections) {
    const base64Img = getBase64Img(sec.image);
    html += `
  <div class="section-card" id="${sec.id}">
    <div class="sec-title">${sec.title}</div>
    <div>
      <span class="badge badge-sys">${sec.system}</span>
      <span class="badge">URL: ${sec.url}</span>
      <span class="badge" style="background:#ECFDF5; color:#065F46; border-color:#A7F3D0;">Vai trò: ${sec.actor}</span>
    </div>

    <div class="info-box">
      <strong>Mục đích nghiệp vụ:</strong> ${sec.purpose}
    </div>

    <strong>Các bước thao tác chuẩn:</strong>
    <ol class="steps-list">
      ${sec.steps.map(s => `<li>${s}</li>`).join('\n      ')}
    </ol>

    ${base64Img ? `
    <div class="img-wrapper">
      <img src="${base64Img}" alt="${sec.caption}">
      <div class="img-caption">${sec.caption}</div>
    </div>` : `
    <div class="info-box" style="border-left-color: #F59E0B; background:#FFFBEB;">
      <em>[Ảnh giao diện thao tác đang được đồng bộ]</em>
    </div>`}
  </div>
`;
  }

  html += `
</body>
</html>
`;

  const htmlPath = path.join(__dirname, '../document/HUONG_DAN_SU_DUNG_HE_THONG_VA_APP_VIONE_TOAN_DIEN.html');
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`>>> USER GUIDE HTML GENERATED: ${htmlPath}`);

  // Print HTML to PDF using Playwright
  console.log('Printing HTML to PDF via Playwright...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(2000);

  const pdfPath = path.join(__dirname, '../document/HUONG_DAN_SU_DUNG_HE_THONG_VA_APP_VIONE_TOAN_DIEN.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '18mm',
      bottom: '20mm',
      left: '15mm',
      right: '15mm'
    }
  });

  await browser.close();
  const stats = fs.statSync(pdfPath);
  console.log(`>>> USER GUIDE PDF GENERATED: ${pdfPath} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
}

generateUserGuidePdf().catch(err => {
  console.error(err);
  process.exit(1);
});
