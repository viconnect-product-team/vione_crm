const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const EVIDENCE_DIR = path.join(__dirname, '../document/images/evidence');
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const BASE_URL = 'https://14.225.217.232:5445';
const API_URL = `${BASE_URL}/api`;

async function snap(page, filename, desc) {
  const filePath = path.join(EVIDENCE_DIR, filename);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`[VIONE CAPTURE] ${filename} -> ${desc}`);
}

async function loginViaApi(email = 'admin@connect.vn', password = '123456') {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    throw new Error(`Login failed with status ${res.status}`);
  }
  return await res.json();
}

async function injectAuth(page, authData) {
  const token = authData.access_token;
  const refreshToken = authData.refresh_token || token;
  const user = authData.user || { email: 'admin@connect.vn', role: 'admin', full_name: 'ViOne Administrator' };

  await page.evaluate(({ token, refreshToken, user }) => {
    localStorage.setItem('vibe_token', token);
    localStorage.setItem('vibe_refresh_token', refreshToken);
    localStorage.setItem('vba_user', JSON.stringify(user));
    localStorage.setItem('user', JSON.stringify(user));
    document.cookie = `sb-access-token=${token}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `sb-refresh-token=${refreshToken}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `vibe_token=${token}; path=/; max-age=86400; SameSite=Lax`;
  }, { token, refreshToken, user });
}

async function run() {
  console.log('=== STARTING VIONE OFFICIAL CAPTURE ===');
  const authData = await loginViaApi();
  console.log('API Login successful for:', authData.user?.email || 'admin@connect.vn');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--ignore-certificate-errors', '--no-sandbox']
  });

  const contextDesktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true
  });
  const pageDesktop = await contextDesktop.newPage();

  // 1. CRM Login
  console.log('1. CRM Login...');
  await pageDesktop.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30000 });
  await pageDesktop.waitForTimeout(1000);
  await snap(pageDesktop, 'vione_crm_01_login.png', 'CRM: Màn hình Đăng nhập Quản trị Doanh nghiệp ViOne');

  // Inject Auth to Desktop
  await injectAuth(pageDesktop, authData);

  // 2. CRM Dashboard
  console.log('2. CRM Dashboard...');
  await pageDesktop.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
  await pageDesktop.waitForTimeout(2000);
  await snap(pageDesktop, 'vione_crm_02_dashboard_kpi.png', 'CRM: Dashboard Tổng quan Điều hành C-Level & Doanh thu');

  // 3. CRM Members
  console.log('3. CRM Members...');
  await pageDesktop.goto(`${BASE_URL}/members`, { waitUntil: 'networkidle', timeout: 30000 });
  await pageDesktop.waitForTimeout(2000);
  await snap(pageDesktop, 'vione_crm_03_members_directory.png', 'CRM: Quản lý Hội viên Doanh nhân & Đối tác B2B');

  // 4. CRM Companies
  console.log('4. CRM Companies...');
  await pageDesktop.goto(`${BASE_URL}/companies`, { waitUntil: 'networkidle', timeout: 30000 });
  await pageDesktop.waitForTimeout(2000);
  await snap(pageDesktop, 'vione_crm_05_companies_multi_tenant.png', 'CRM: Quản trị Doanh nghiệp Đa công ty');

  // 5. CRM Opportunities
  console.log('5. CRM Opportunities...');
  await pageDesktop.goto(`${BASE_URL}/opportunities`, { waitUntil: 'networkidle', timeout: 30000 });
  await pageDesktop.waitForTimeout(2000);
  await snap(pageDesktop, 'vione_crm_06_opportunities_b2b.png', 'CRM: Cơ hội Giao thương & Sàn Khớp lệnh B2B');

  // 6. CRM Events
  console.log('6. CRM Events...');
  await pageDesktop.goto(`${BASE_URL}/events`, { waitUntil: 'networkidle', timeout: 30000 });
  await pageDesktop.waitForTimeout(2000);
  await snap(pageDesktop, 'vione_crm_07_events_management.png', 'CRM: Quản lý Sự kiện & Hội thảo Doanh nhân');

  // 7. CRM Products
  console.log('7. CRM Products...');
  await pageDesktop.goto(`${BASE_URL}/products`, { waitUntil: 'networkidle', timeout: 30000 });
  await pageDesktop.waitForTimeout(2000);
  await snap(pageDesktop, 'vione_crm_09_products_marketplace.png', 'CRM: Sàn Sản phẩm & Dịch vụ B2B Showcase');

  // 8. CRM Workflow
  console.log('8. CRM Workflow...');
  await pageDesktop.goto(`${BASE_URL}/workflow`, { waitUntil: 'networkidle', timeout: 30000 });
  await pageDesktop.waitForTimeout(2000);
  await snap(pageDesktop, 'vione_crm_10_workflow_bpmn.png', 'CRM: Quản trị Quy trình BPMN 2.0 & Tiến độ Công việc');

  // 9. CRM Workload
  console.log('9. CRM Workload...');
  await pageDesktop.goto(`${BASE_URL}/workload`, { waitUntil: 'networkidle', timeout: 30000 });
  await pageDesktop.waitForTimeout(2000);
  await snap(pageDesktop, 'vione_crm_11_workload_matrix.png', 'CRM: Giám sát Tải Công việc & Giờ làm Nhân sự');

  // 10. CRM Attendance
  console.log('10. CRM Attendance...');
  await pageDesktop.goto(`${BASE_URL}/attendance`, { waitUntil: 'networkidle', timeout: 30000 });
  await pageDesktop.waitForTimeout(2000);
  await snap(pageDesktop, 'vione_crm_12_attendance_gps_faceid.png', 'CRM: Giám sát Chấm công GPS 50m & AI FaceID');

  // 11. CRM Payment Approvals
  console.log('11. CRM Payment Approvals...');
  await pageDesktop.goto(`${BASE_URL}/payment-approvals`, { waitUntil: 'networkidle', timeout: 30000 });
  await pageDesktop.waitForTimeout(2000);
  await snap(pageDesktop, 'vione_crm_13_payment_approvals_3tier.png', 'CRM: Phê duyệt Chi 3 cấp Maker-Checker-Approver & VietQR');

  // 12. CRM Income
  console.log('12. CRM Income...');
  await pageDesktop.goto(`${BASE_URL}/income`, { waitUntil: 'networkidle', timeout: 30000 });
  await pageDesktop.waitForTimeout(2000);
  await snap(pageDesktop, 'vione_crm_14_income_cashbook.png', 'CRM: Quản lý Nguồn thu Doanh nghiệp');

  // 13. CRM Expenses
  console.log('13. CRM Expenses...');
  await pageDesktop.goto(`${BASE_URL}/expenses`, { waitUntil: 'networkidle', timeout: 30000 });
  await pageDesktop.waitForTimeout(2000);
  await snap(pageDesktop, 'vione_crm_15_expenses_cashbook.png', 'CRM: Quản lý Chi phí Doanh nghiệp');

  // 14. CRM Settings
  console.log('14. CRM Settings...');
  await pageDesktop.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle', timeout: 30000 });
  await pageDesktop.waitForTimeout(2000);
  await snap(pageDesktop, 'vione_crm_17_system_settings.png', 'CRM: Cài đặt Hệ thống & Phân quyền RBAC');

  // NOW MOBILE APP CAPTURE (Viewport: 390 x 844 iPhone 14/15)
  console.log('--- STARTING MOBILE APP CAPTURE ---');
  const contextMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    ignoreHTTPSErrors: true
  });
  const pageMobile = await contextMobile.newPage();

  // 15. App Login Screen
  console.log('15. App Login Screen...');
  await pageMobile.goto(`${BASE_URL}/vione/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await pageMobile.waitForTimeout(1500);
  await snap(pageMobile, 'vione_app_01_login_luxury.png', 'App: Màn hình Đăng nhập Dark Luxury Obsidian ViOne Connect');

  // Inject Auth to Mobile
  await injectAuth(pageMobile, authData);

  // 16. App Executive Home
  console.log('16. App Executive Home...');
  await pageMobile.goto(`${BASE_URL}/connect-app`, { waitUntil: 'networkidle', timeout: 30000 });
  await pageMobile.waitForTimeout(2500);
  await snap(pageMobile, 'vione_app_02_executive_home.png', 'App: Trang chủ Điều hành Executive Home');

  // 17. App Schedule Tabs & Insight Card (scroll down slightly)
  console.log('17. App Schedule & Insight...');
  await pageMobile.evaluate(() => window.scrollBy(0, 280));
  await pageMobile.waitForTimeout(1000);
  await snap(pageMobile, 'vione_app_04_editorial_schedule_tabs.png', 'App: 3 Tab Lịch hẹn & Thẻ Cơ hội Kết nối Tiềm năng');

  // 18. App Enterprise Operations Card (scroll down further)
  console.log('18. App Enterprise Operations Card...');
  await pageMobile.evaluate(() => window.scrollBy(0, 320));
  await pageMobile.waitForTimeout(1000);
  await snap(pageMobile, 'vione_app_07_enterprise_operations_card.png', 'App: Khối Giám sát Vận hành & Nhân sự Doanh nghiệp');

  // 19. App Network & Partners
  console.log('19. App Network...');
  await pageMobile.goto(`${BASE_URL}/connect-app/network`, { waitUntil: 'networkidle', timeout: 30000 });
  await pageMobile.waitForTimeout(2000);
  await snap(pageMobile, 'vione_app_11_network_partners.png', 'App: Danh bạ Mạng lưới Đối tác & Doanh nhân C-Level');

  // 20. App Inbox / Messages
  console.log('20. App Messages Inbox...');
  await pageMobile.goto(`${BASE_URL}/connect-app/inbox`, { waitUntil: 'networkidle', timeout: 30000 });
  await pageMobile.waitForTimeout(2000);
  await snap(pageMobile, 'vione_app_12_messages_inbox.png', 'App: Hộp thư Tin nhắn Messenger 4 Danh mục');

  // 21. App Digital VIP Card
  console.log('21. App Digital VIP Card...');
  await pageMobile.goto(`${BASE_URL}/connect-app/card`, { waitUntil: 'networkidle', timeout: 30000 });
  await pageMobile.waitForTimeout(2000);
  await snap(pageMobile, 'vione_app_14_digital_card_3d.png', 'App: Danh thiếp Điện tử Cá nhân B2B & Mã QR Định danh');

  // 22. App Moments Feed
  console.log('22. App Moments Feed...');
  await pageMobile.goto(`${BASE_URL}/connect-app/moments`, { waitUntil: 'networkidle', timeout: 30000 });
  await pageMobile.waitForTimeout(2000);
  await snap(pageMobile, 'vione_app_16_b2b_moments_feed.png', 'App: B2B Moments Bảng tin Giao thương Kết nối Doanh nhân');

  await browser.close();
  console.log('=== VIONE OFFICIAL CAPTURE COMPLETED SUCCESSFULLY ===');
}

run().catch(err => {
  console.error('Fatal error during capture:', err);
  process.exit(1);
});
