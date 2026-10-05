const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');

const rootDir = path.resolve(__dirname, '..');
const OUT_DIR = path.join(rootDir, 'document', 'images', 'evidence_live_2026');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const SERVER_BASE = 'https://14.225.217.232:5445';
const API_LOGIN = `${SERVER_BASE}/api/auth/login`;

async function getAuthSession(email, password) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email, password });
    const req = https.request(API_LOGIN, {
      method: 'POST',
      rejectUnauthorized: false,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.access_token) {
            resolve(parsed);
          } else {
            reject(new Error(`Login failed: ${body}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function injectAuth(page, session) {
  const token = session.access_token;
  const refreshToken = session.refresh_token || token;
  const user = session.user || { email: 'admin@vione.vn', role: 'admin' };

  await page.evaluate(({ token, refreshToken, user }) => {
    localStorage.setItem('vibe_token', token);
    localStorage.setItem('vibe_refresh_token', refreshToken);
    localStorage.setItem('vba_token', token);
    localStorage.setItem('vba_user', JSON.stringify(user));
    localStorage.setItem('vba_active_assoc_id', 'vba-global');
    document.cookie = `sb-access-token=${token}; path=/; max-age=3600; SameSite=Lax`;
    document.cookie = `sb-refresh-token=${refreshToken}; path=/; max-age=604800; SameSite=Lax`;
  }, { token, refreshToken, user });
}

async function snap(page, filename, desc) {
  const targetPath = path.join(OUT_DIR, filename);
  await page.screenshot({ path: targetPath, fullPage: false });
  console.log(`[OK] Captured: ${filename} - ${desc}`);
}

async function run() {
  console.log('>>> [START] BAT DAU CHUP TOAN BO ANH MOI HE SINH THAI VIONE TU SERVER DEV...');
  console.log(`>>> Server Dev: ${SERVER_BASE}`);
  
  let authSession;
  try {
    authSession = await getAuthSession('admin@vione.vn', '123456');
    console.log('  -> Dang nhap thanh cong voi admin@vione.vn');
  } catch (err) {
    console.error('  -> Loi dang nhap backend:', err.message);
    return;
  }

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--ignore-certificate-errors', '--no-sandbox']
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  });

  // ==========================================
  // PHAN 1: WEB CRM VIONE (DESKTOP 1440x900)
  // ==========================================
  console.log('\n--- [PHAN 1] CHUP CAC MAN HINH WEB CRM VIONE ---');
  const crmPage = await context.newPage();
  await crmPage.setViewportSize({ width: 1440, height: 900 });

  // 1. CRM Login Light Mode
  try {
    await crmPage.goto(`${SERVER_BASE}/auth`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await crmPage.waitForTimeout(2000);
    await snap(crmPage, 'crm_01_login_light_gold.png', 'Màn hình Đăng nhập Hệ thống CRM ViOne Phong cách Sáng Sang Trọng');
  } catch (e) {
    console.log('Error crm_01:', e.message);
  }

  // Inject session
  await injectAuth(crmPage, authSession);

  // Danh sách các route CRM cần chụp
  const crmRoutes = [
    { route: '/dashboard', file: 'crm_02_executive_dashboard.png', desc: 'Bảng Điều Hành Số C-Level Toàn Diện ViOne CRM' },
    { route: '/members', file: 'crm_03_smart_crm_customers.png', desc: 'Trung Tâm Quản Trị Khách Hàng B2B & Lead 360°' },
    { route: '/deals', file: 'crm_04_pipeline_kanban_deals.png', desc: 'Phễu Bán Hàng & Cơ Hội Kinh Doanh Kanban Deals' },
    { route: '/companies', file: 'crm_05_companies_enterprises.png', desc: 'Quản Lý Danh Sách Doanh Nghiệp & Chi Nhánh' },
    { route: '/cards', file: 'crm_06_smart_nfc_cards.png', desc: 'Quản Trị Thẻ Thông Minh NFC & Danh Thiếp Số 3D' },
    { route: '/workflow', file: 'crm_07_workflow_kanban_tasks.png', desc: 'Quản Trị Quy Trình Công Việc & Giao Việc Tự Động' },
    { route: '/workload', file: 'crm_08_workload_heatmap.png', desc: 'Giám Sát Tải Trọng & Khối Lượng Công Việc Nhân Sự' },
    { route: '/attendance', file: 'crm_09_gps_attendance_hrm.png', desc: 'Chấm Công Định Vị GPS & Nhân Diện Khuôn Mặt AI' },
    { route: '/payment-approvals', file: 'crm_10_payment_approvals_3tier.png', desc: 'Phê Duyệt Tài Chính Thu Chi 3 Cấp & VietQR Napas' },
    { route: '/income', file: 'crm_11_finance_cashflow_books.png', desc: 'Sổ Quỹ Thu Chi & Báo Cáo Dòng Tiền Thời Gian Thực' },
    { route: '/marketplace', file: 'crm_12_b2b_marketplace_products.png', desc: 'Sàn Giao Thương B2B & Gian Hàng Sản Phẩm Doanh Nghiệp' },
    { route: '/opportunities', file: 'crm_13_b2b_tenders_opportunities.png', desc: 'Quản Lý Cơ Hội Mời Thầu & Hợp Tác B2B' },
    { route: '/events', file: 'crm_14_events_qr_checkin.png', desc: 'Quản Lý Sự Kiện Doanh Nghiệp & Điểm Danh QR Check-in' },
    { route: '/meetings', file: 'crm_15_b2b_one_on_one_meetings.png', desc: 'Quản Lý Lịch Hẹn & Cuộc Gặp 1-on-1 Doanh Nhân' },
    { route: '/messages', file: 'crm_16_multichannel_messenger.png', desc: 'Hộp Thư Đa Kênh Messenger Trao Đổi Lãnh Đạo' },
    { route: '/voting', file: 'crm_17_digital_voting_surveys.png', desc: 'Biểu Quyết Số & Khảo Sát Ý Kiến C-Level' },
    { route: '/platform/permissions', file: 'crm_18_rbac_permissions_matrix.png', desc: 'Ma Trận Phân Quyền 7 Nhóm Quyền x 6 Thao Tác' },
    { route: '/platform/ai-audit', file: 'crm_19_ai_copilot_audit_logs.png', desc: 'Nhật Ký Kiểm Toán & 6 Năng Lực AI Copilot 5.0' },
    { route: '/platform/introduction-operations', file: 'crm_20_c_level_operations.png', desc: 'Vận Hành Kết Nối & Giới Thiệu Doanh Nghiệp' },
    { route: '/platform/renewal-audit', file: 'crm_21_renewal_audit_history.png', desc: 'Lịch Sử Gia Hạn & Kiểm Toán Thu Phí Nền Tảng' },
    { route: '/settings', file: 'crm_22_system_settings_branding.png', desc: 'Cài Đặt Hệ Thống, Nhận Diện Thương Hiệu & Logo' }
  ];

  for (const item of crmRoutes) {
    try {
      console.log(`Navigating to CRM: ${item.route}...`);
      await crmPage.goto(`${SERVER_BASE}${item.route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await crmPage.waitForTimeout(2000);
      await snap(crmPage, item.file, item.desc);
    } catch (e) {
      console.log(`Loi khi chup ${item.route}:`, e.message);
    }
  }

  // ==========================================
  // PHAN 2: MOBILE APP VIONE CONNECT (390x844)
  // ==========================================
  console.log('\n--- [PHAN 2] CHUP CAC MAN HINH APP MOBILE VIONE CONNECT ---');
  const mobPage = await context.newPage();
  await mobPage.setViewportSize({ width: 390, height: 844 }); // iPhone 14/15 Pro size

  // 1. Mobile Login
  try {
    await mobPage.goto(`${SERVER_BASE}/vione/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await mobPage.waitForTimeout(2000);
    await snap(mobPage, 'app_01_mobile_login.png', 'Màn hình Đăng nhập App Di động ViOne Connect');
  } catch (e) {
    console.log('Error app_01:', e.message);
  }

  // 2. Mobile In-App Register
  try {
    await mobPage.goto(`${SERVER_BASE}/register`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await mobPage.waitForTimeout(2000);
    await snap(mobPage, 'app_02_mobile_register_in_app.png', 'Màn hình Đăng ký Tài khoản Mới In-App Trực tiếp');
  } catch (e) {
    console.log('Error app_02:', e.message);
  }

  // Inject session for mobile app
  await injectAuth(mobPage, authSession);

  // 3. Home Screen
  try {
    await mobPage.goto(`${SERVER_BASE}/connect-app`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await mobPage.waitForTimeout(2500);
    await snap(mobPage, 'app_03_home_dashboard.png', 'Trang chủ Doanh nhân ViOne Connect & Thẻ Hội Viên');

    // 4. Click thẻ hội viên mở Bottom Sheet cong tròn vuốt tay xuống
    const memberCard = await mobPage.$('[class*="card"], [class*="member"], button, div:has-text("HỘI VIÊN"), div:has-text("DOANH NHÂN")');
    if (memberCard) {
      await memberCard.click().catch(() => {});
      await mobPage.waitForTimeout(1500);
      await snap(mobPage, 'app_04_member_card_bottom_sheet.png', 'Bottom Sheet Thẻ Hội viên Bo Tròn 36px Tích hợp Vuốt Tay Xuống');
      
      // Bấm nút đóng hoặc click backdrop để đóng sheet
      const closeBtn = await mobPage.$('button:has-text("✕"), button:has-text("Đóng"), [class*="close"]');
      if (closeBtn) {
        await closeBtn.click().catch(() => {});
        await mobPage.waitForTimeout(1000);
      }
    }
  } catch (e) {
    console.log('Error app_03/04:', e.message);
  }

  // 5. Nút V Hành động ViOne ở giữa
  try {
    await mobPage.goto(`${SERVER_BASE}/connect-app`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await mobPage.waitForTimeout(1500);
    const vBtn = await mobPage.$('button[aria-label*="ViOne"], button:has([class*="vione"]), button:has-text("V"), div[class*="rounded-full"]:has-text("V")');
    if (vBtn) {
      await vBtn.click().catch(() => {});
      await mobPage.waitForTimeout(1500);
      await snap(mobPage, 'app_05_v_action_sheet.png', 'Bảng Điều Khiển Nhanh Nút ViOne Mạ Vàng Trung Tâm (VActionSheet)');
      
      // Đóng sheet
      await mobPage.keyboard.press('Escape');
      await mobPage.waitForTimeout(1000);
    }
  } catch (e) {
    console.log('Error app_05:', e.message);
  }

  // 6. Tab Network (Kết nối đối tác)
  try {
    await mobPage.goto(`${SERVER_BASE}/connect-app?tab=network`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await mobPage.waitForTimeout(2500);
    await snap(mobPage, 'app_06_network_connections.png', 'Màn hình Mạng Lưới Đối Tác & Stories 24h Lãnh Đạo');
  } catch (e) {
    console.log('Error app_06:', e.message);
  }

  // 7. Tab Community (Cộng đồng & Sàn Giao thương)
  try {
    await mobPage.goto(`${SERVER_BASE}/connect-app?tab=community`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await mobPage.waitForTimeout(2500);
    await snap(mobPage, 'app_07_community_marketplace.png', 'Màn hình Cộng Đồng Doanh Nghiệp & Sàn Cơ Hội B2B');
  } catch (e) {
    console.log('Error app_07:', e.message);
  }

  // 8. Tab Me / Profile (Tôi - Danh thiếp Titanium 3D)
  try {
    await mobPage.goto(`${SERVER_BASE}/connect-app?tab=me`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await mobPage.waitForTimeout(2500);
    await snap(mobPage, 'app_08_me_digital_identity.png', 'Màn hình Danh Tính Số C-Level & Danh Thiếp Thông Minh');
  } catch (e) {
    console.log('Error app_08:', e.message);
  }

  // 9. Modal Cài đặt iOS PWA
  try {
    await mobPage.goto(`${SERVER_BASE}/connect-app`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await mobPage.waitForTimeout(1500);
    // Kích hoạt hiển thị modal cài đặt PWA nếu có
    await mobPage.evaluate(() => {
      window.dispatchEvent(new CustomEvent('open-pwa-install-modal'));
    });
    await mobPage.waitForTimeout(1000);
    await snap(mobPage, 'app_09_ios_pwa_install_prompt.png', 'Thông Báo Cài Đặt PWA 1-Chạm Trên iPhone / iPad');
  } catch (e) {
    console.log('Error app_09:', e.message);
  }

  // 10. Hộp thư chat Messenger C-Level
  try {
    await mobPage.goto(`${SERVER_BASE}/connect-app/inbox`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await mobPage.waitForTimeout(2500);
    await snap(mobPage, 'app_10_inbox_messenger.png', 'Hộp Thư Trực Tiếp & Kênh Chat B2B Doanh Nhân');
  } catch (e) {
    console.log('Error app_10:', e.message);
  }

  await browser.close();
  console.log('\n>>> [HOAN TAT] DA CHUP XONG FULL BO ANH MOI CUA HE SINH THAI VIONE!');
  const files = fs.readdirSync(OUT_DIR);
  console.log(`>>> Tong so anh chup thanh cong: ${files.length} anh trong ${OUT_DIR}`);
}

run().catch(err => console.error('Loi toan cuc:', err));
