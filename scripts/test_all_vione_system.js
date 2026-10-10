/**
 * TEST TOÀN DIỆN HỆ THỐNG VIONE CRM & APP VIONE QUA LOCALHOST:5137
 * Kiểm tra đầy đủ:
 * 1. Frontend routes (HTML 200 OK)
 * 2. RESTful APIs qua Proxy localhost:5137/api
 * 3. Validation Input (FE & BE, HTTP 400)
 * 4. Authentication & JWT Tokens (HTTP 200, 401)
 * 5. Role-based Access Control (RBAC, HTTP 403)
 * 6. Business Operations (CRM, Tasks, HRM, Finance, Network, Community, Identity)
 */

const BASE_URL = 'http://localhost:5137';
const API_URL = `${BASE_URL}/api`;

const results = [];

async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const duration = Date.now() - start;
    let data = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json().catch(() => null);
    } else {
      data = await res.text().catch(() => null);
    }
    return { status: res.status, ok: res.ok, data, duration };
  } catch (err) {
    return { status: 0, ok: false, error: err.message, duration: Date.now() - start };
  }
}

function recordTest(moduleName, testCase, passed, details) {
  results.push({
    module: moduleName,
    testCase,
    passed,
    details,
  });
  const statusStr = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${statusStr} [${moduleName}] - ${testCase}`);
  if (!passed) {
    console.log(`   Lỗi chi tiết:`, details);
  }
}

async function runAllTests() {
  console.log('=================================================================');
  console.log('>>> KHỞI CHẠY KIỂM THỬ TOÀN DIỆN VIONE TRÊN LOCALHOST:5137 <<<');
  console.log('=================================================================\n');

  // 1. FRONTEND ROUTES
  console.log('--- 1. KIỂM THỬ ĐIỀU HƯỚNG FRONTEND ROUTES (200 OK) ---');
  const feRoutes = [
    { path: '/', name: 'Bảng điều hành CRM Executive' },
    { path: '/workflow', name: 'Quy trình công việc Kanban' },
    { path: '/attendance', name: 'Quản trị chấm công HRM' },
    { path: '/payment-approvals', name: 'Phê duyệt chi 3 cấp' },
    { path: '/connect-app', name: 'App ViOne Connect PWA' },
    { path: '/marketplace', name: 'Sàn thương mại B2B Marketplace' },
    { path: '/documents', name: 'Kho tài liệu số' },
  ];

  for (const r of feRoutes) {
    const res = await request(`${BASE_URL}${r.path}`);
    const isOk = res.status === 200 && typeof res.data === 'string' && res.data.includes('<!DOCTYPE html>');
    recordTest('Frontend Routes', `Truy cập route "${r.name}" (${r.path})`, isOk, `Status: ${res.status}`);
  }

  // 2. AUTHENTICATION & VALIDATION
  console.log('\n--- 2. KIỂM THỬ AUTHENTICATION & VALIDATION BE ---');
  // 2.1 Login Admin
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'admin@vione.vn', password: '123456' }),
  });
  const adminOk = adminLogin.status === 200 && !!adminLogin.data?.access_token;
  recordTest('Auth', 'Đăng nhập tài khoản Admin (admin@vione.vn)', adminOk, adminLogin.data);
  const adminToken = adminLogin.data?.access_token;

  // 2.2 Login Member / Staff
  const memberLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'tech.solutions@vione.vn', password: '123456' }),
  });
  const memberOk = memberLogin.status === 200 && !!memberLogin.data?.access_token;
  recordTest('Auth', 'Đăng nhập tài khoản Thành viên (tech.solutions@vione.vn)', memberOk, memberLogin.data);
  const memberToken = memberLogin.data?.access_token;

  // 2.3 Login sai mật khẩu -> 401 Unauthorized
  const wrongPass = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'admin@vione.vn', password: 'wrongpassword' }),
  });
  const wrongPassOk = wrongPass.status === 401;
  recordTest('Auth & Security', 'Chặn đăng nhập sai mật khẩu (HTTP 401 Unauthorized)', wrongPassOk, wrongPass.data);

  // 2.4 Login thiếu trường dữ liệu -> 400 Bad Request
  const invalidLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  const invalidLoginOk = invalidLogin.status === 400 || invalidLogin.status === 401;
  recordTest('Validation Pipe', 'Validate dữ liệu đăng nhập rỗng (HTTP 400/401)', invalidLoginOk, invalidLogin.data);

  // 2.5 Auth Me với Token Admin
  const authMe = await request('/auth/me', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const authMeOk = authMe.status === 200 && authMe.data?.username === 'admin@vione.vn';
  recordTest('Auth', 'Lấy thông tin người dùng /auth/me (JWT Bearer Token)', authMeOk, authMe.data);

  // 2.6 Endpoint bảo vệ không gửi Token -> 401 Unauthorized
  const noToken = await request('/auth/me');
  const noTokenOk = noToken.status === 401;
  recordTest('Security Guard', 'Chặn truy cập endpoint bảo mật khi thiếu Bearer Token (HTTP 401)', noTokenOk, noToken.data);

  // 3. CRM VIONE BUSINESS MODULES
  console.log('\n--- 3. KIỂM THỬ CÁC MODULES NGHIỆP VỤ CRM VIONE ---');

  // 3.1 Khách hàng CRM
  const getCustomers = await request('/connect-app/customers', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  recordTest('CRM Customers', 'Lấy danh sách khách hàng (/connect-app/customers)', getCustomers.status === 200, getCustomers.data);

  // 3.2 Thêm khách hàng mới với chuẩn DTO
  const newCustomerRes = await request('/connect-app/customers', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      fullName: 'Khách Hàng Doanh Nghiệp Mới ' + Date.now(),
      companyName: 'Tập Đoàn Vione Enterprise',
      jobTitle: 'Tổng Giám Đốc',
      phone: '0988776655',
      email: `contact.${Date.now()}@vione.vn`,
      stage: 'lead',
      pipelineAmount: '50000000',
    }),
  });
  recordTest('CRM Customers', 'Thêm mới khách hàng tiềm năng B2B (POST /connect-app/customers)', newCustomerRes.status === 200 || newCustomerRes.status === 201, newCustomerRes.data);

  // 3.3 Quy trình công việc (Kanban Tasks)
  const getTasks = await request('/operations/workflow/tasks', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  recordTest('Workflow Kanban', 'Lấy danh sách công việc Kanban (/operations/workflow/tasks)', getTasks.status === 200, getTasks.data);

  // 3.4 Tạo thẻ công việc mới với chuẩn DTO
  const createTaskRes = await request('/operations/workflow/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      title: 'Triển khai bảo trì hệ thống ' + Date.now(),
      assignee: 'Trần Quốc Đạt',
      deadline: new Date(Date.now() + 86400000).toISOString(),
      department: 'Phòng Kỹ Thuật',
      priority: 'high',
      description: 'Quy trình kiểm tra vận hành hệ thống định kỳ',
      checklist: [{ id: 'chk-1', text: 'Kiểm tra hạ tầng mạng', done: false }],
    }),
  });
  recordTest('Workflow Kanban', 'Tạo mới thẻ việc Kanban (POST /operations/workflow/tasks)', createTaskRes.status === 200 || createTaskRes.status === 201, createTaskRes.data);

  // 3.5 Chấm công & Hiện diện nhân sự (HRM)
  const getAttendance = await request('/operations/attendance', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  recordTest('HRM Attendance', 'Lấy lịch sử chấm công (/operations/attendance)', getAttendance.status === 200, getAttendance.data);

  // 3.6 Đơn nghỉ phép (Leaves)
  const getLeaves = await request('/operations/attendance/leaves', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  recordTest('HRM Leaves', 'Lấy danh sách đơn nghỉ phép (/operations/attendance/leaves)', getLeaves.status === 200, getLeaves.data);

  // 3.7 Phê duyệt chi tiền (Finance Approvals)
  const getApprovals = await request('/operations/finance/approvals', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  recordTest('Finance Approvals', 'Lấy danh sách phê duyệt chi tiền (/operations/finance/approvals)', getApprovals.status === 200, getApprovals.data);

  // 3.8 Phòng họp (Meeting Rooms)
  const getMeetings = await request('/meetings', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  recordTest('Meeting Rooms', 'Lấy danh sách lịch họp & đặt phòng (/meetings)', getMeetings.status === 200, getMeetings.data);

  // 4. APP VIONE & CỘNG ĐỒNG B2B
  console.log('\n--- 4. KIỂM THỬ CÁC CHỨC NĂNG CỦA APP VIONE ---');

  // 4.1 Briefing Lãnh Đạo
  const getBriefing = await request('/me/briefing', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  recordTest('App ViOne Briefing', 'Lấy lịch trình & Briefing lãnh đạo (/me/briefing)', getBriefing.status === 200, getBriefing.data);

  // 4.2 Danh tính số & Thẻ doanh nhân
  const getIdentity = await request('/me/identity', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  recordTest('App ViOne Identity', 'Lấy hồ sơ định danh số doanh nhân (/me/identity)', getIdentity.status === 200, getIdentity.data);

  // 4.3 Mạng lưới đối tác (Network Connections)
  const getConnections = await request('/network/connections', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  recordTest('App ViOne Network', 'Lấy danh sách kết nối đối tác (/network/connections)', getConnections.status === 200, getConnections.data);

  // 4.4 Cộng đồng doanh nghiệp
  const getActiveCommunity = await request('/communities/active', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  recordTest('App ViOne Community', 'Lấy thông tin cộng đồng đang hoạt động (/communities/active)', getActiveCommunity.status === 200, getActiveCommunity.data);

  // 4.5 Kiểm tra trạng thái công ty & nhân viên (Role CEO Suite logic)
  const getStaffStatus = await request('/communities/company-staff-status', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  recordTest('App ViOne Roles', 'Kiểm tra trạng thái nhân sự trực thuộc (/communities/company-staff-status)', getStaffStatus.status === 200, getStaffStatus.data);

  // 4.6 Việc của tôi (Nhận việc nhân sự)
  const getMyTasks = await request('/communities/tasks/my-all', {
    headers: { Authorization: `Bearer ${memberToken}` },
  });
  recordTest('App ViOne Tasks', 'Nhân viên lấy danh sách việc cần tiếp nhận (/communities/tasks/my-all)', getMyTasks.status === 200, getMyTasks.data);

  // 5. RBAC & PERMISSION BOUNDARIES
  console.log('\n--- 5. KIỂM THỬ PHÂN QUYỀN RBAC & BẢO MẬT SỞ HỮU DỮ LIỆU ---');

  // 5.1 Quản trị người dùng (Admin)
  const getUsersList = await request('/users', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  recordTest('RBAC Admin', 'Tài khoản Admin truy xuất danh sách người dùng hệ thống (/users)', getUsersList.status === 200, getUsersList.data);

  // 5.2 Thành viên thường gọi API quản trị -> Bắt buộc từ chối hoặc chặn theo quyền
  const memberGetUsers = await request('/users', {
    headers: { Authorization: `Bearer ${memberToken}` },
  });
  const rbacOk = memberGetUsers.status === 403 || memberGetUsers.status === 401;
  recordTest('RBAC Security', 'Chặn tài khoản Thành viên thường truy cập API quản trị người dùng (HTTP 403/401)', rbacOk, memberGetUsers.data);

  // 6. TỔNG KẾT
  console.log('\n=================================================================');
  const total = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = total - passedCount;
  console.log(`>>> TỔNG HỢP KẾT QUẢ KIỂM THỬ: ${passedCount}/${total} PASSED (${((passedCount / total) * 100).toFixed(1)}%)`);
  if (failedCount > 0) {
    console.log(`⚠️ Có ${failedCount} trường hợp cần hiệu chỉnh:`);
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`   - [${r.module}] ${r.testCase}:`, r.details);
      });
  } else {
    console.log('🎉 TOÀN BỘ CÁC CHỨC NĂNG ĐỀU HOÀN TOÀN ĐẠT CHUẨN TRÊN LOCALHOST:5137!');
  }
  console.log('=================================================================\n');

  process.exit(failedCount > 0 ? 1 : 0);
}

runAllTests().catch((err) => {
  console.error('Lỗi nghiêm trọng khi chạy test script:', err);
  process.exit(1);
});
