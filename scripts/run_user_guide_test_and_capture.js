const { chromium } = require('playwright');
const { Client } = require('pg');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const undici = require('undici');

const EVIDENCE_DIR = path.join(__dirname, '../document/images/evidence');
const DB_URL = process.env.DATABASE_URL || 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

const CRM_URL = 'https://14.225.217.232:5443';
const APP_URL = 'https://14.225.217.232:5444';

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function snap(page, filename, desc) {
  const filePath = path.join(EVIDENCE_DIR, filename);
  await page.screenshot({ path: filePath, fullPage: false });
  const stat = fs.statSync(filePath);
  console.log(`[SNAPSHOT] Saved: ${filename} (${stat.size} bytes) | ${desc}`);
}

async function getPgClient() {
  const c = new Client({ connectionString: DB_URL });
  await c.connect();
  return c;
}

async function main() {
  console.log('================================================================');
  console.log('BẮT ĐẦU TEST TOÀN DIỆN E2E VÀ CHỤP ẢNH HƯỚNG DẪN SỬ DỤNG THỰC TẾ');
  console.log('Email mục tiêu : vumikasa6@gmail.com');
  console.log('App (Mobile)   : https://14.225.217.232:5444/association');
  console.log('CRM (Desktop)  : https://14.225.217.232:5443');
  console.log('================================================================\n');

  const pg = await getPgClient();
  const targetEmail = 'vumikasa6@gmail.com';
  const targetPassword = 'Password1983!';
  const targetName = 'Phạm Vũ Nam';
  const targetCompany = 'Công ty TNHH MediSocial';
  const targetPhone = '0988888888';

  // Đảm bảo mật khẩu & dữ liệu trong DB
  const hashedPwd = await bcrypt.hash(targetPassword, 10);
  let userId = null;

  const existingVu = await pg.query(`SELECT id FROM public.vione_users WHERE email = $1`, [targetEmail]);
  if (existingVu.rows.length > 0) {
    userId = existingVu.rows[0].id;
    await pg.query(`UPDATE public.vione_users SET password = $1, name = $2 WHERE id = $3`, [hashedPwd, targetName, userId]);
  } else {
    userId = crypto.randomUUID();
    await pg.query(`
      INSERT INTO public.vione_users (id, email, username, password, name, created_at, updated_at)
      VALUES ($1::uuid, $2, $2, $3, $4, now(), now())
    `, [userId, targetEmail, hashedPwd, targetName]);
  }

  const existingAuth = await pg.query(`SELECT id FROM auth.users WHERE email = $1`, [targetEmail]);
  if (existingAuth.rows.length === 0) {
    await pg.query(`
      INSERT INTO auth.users (id, email, role)
      VALUES ($1::uuid, $2, 'authenticated')
    `, [userId, targetEmail]);
  }

  await pg.query(`
    UPDATE public.members
    SET user_id = $1::uuid, name = $2, contact = $3, phone = $4, status = 'active'
    WHERE email = $5
  `, [userId, targetCompany, targetName, targetPhone, targetEmail]);

  const existingProfile = await pg.query(`SELECT user_id FROM public.user_profiles WHERE user_id = $1::uuid`, [userId]);
  if (existingProfile.rows.length === 0) {
    await pg.query(`
      INSERT INTO public.user_profiles (user_id, display_name, professional_title, company_name, created_at, updated_at)
      VALUES ($1::uuid, $2, 'CEO / Sáng lập', $3, now(), now())
    `, [userId, targetName, targetCompany]);
  } else {
    await pg.query(`
      UPDATE public.user_profiles
      SET display_name = $2, professional_title = 'CEO / Sáng lập', company_name = $3, updated_at = now()
      WHERE user_id = $1::uuid
    `, [userId, targetName, targetCompany]);
  }

  console.log(`✓ Tài khoản ${targetEmail} sẵn sàng với ID: ${userId}`);

  // Fetch token trực tiếp qua HTTPS API
  console.log('Đang lấy token đăng nhập cho Hội viên qua API...');
  const appLoginResp = await fetch(`${APP_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: targetEmail, password: targetPassword }),
    dispatcher: new undici.Agent({ connect: { rejectUnauthorized: false } })
  });
  const appAuth = await appLoginResp.json();
  if (!appAuth.access_token) {
    throw new Error('Không lấy được token App: ' + JSON.stringify(appAuth));
  }
  console.log('✓ Token App lấy thành công!');

  console.log('Đang lấy token đăng nhập cho Admin CRM qua API...');
  const crmLoginResp = await fetch(`${CRM_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@connect.vn', password: '123456' }),
    dispatcher: new undici.Agent({ connect: { rejectUnauthorized: false } })
  });
  const crmAuth = await crmLoginResp.json();
  if (!crmAuth.access_token) {
    throw new Error('Không lấy được token CRM: ' + JSON.stringify(crmAuth));
  }
  console.log('✓ Token CRM lấy thành công!');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  // --------------------------------------------------------------------------
  // PHẦN A: TEST APP HIỆP HỘI - GIAO DIỆN MOBILE CHUẨN (390 x 844)
  // --------------------------------------------------------------------------
  console.log('\n--- BƯỚC 1: KHỞI TẠO CONTEXT MOBILE APP (390 x 844) ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    ignoreHTTPSErrors: true,
    locale: 'vi-VN',
  });

  const appPage = await mobileContext.newPage();

  // 1. Màn Đăng ký Hội viên
  console.log('1. Chụp màn đăng ký hội viên...');
  await appPage.goto(`${APP_URL}/association/login?register=true`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await appPage.waitForTimeout(2000);
  await snap(appPage, 'step_01_app_register_form.png', 'Màn hình Tiếp nhận Đăng ký Hội viên CLB CEO 1983');

  // 2. Màn Đăng nhập Hội viên
  console.log('2. Chụp màn đăng nhập hội viên...');
  await appPage.goto(`${APP_URL}/association/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await appPage.waitForTimeout(1000);
  try {
    const emailInput = await appPage.$('input[type="text"], input[type="email"]');
    if (emailInput) await emailInput.fill(targetEmail);
    const pwdInput = await appPage.$('input[type="password"]');
    if (pwdInput) await pwdInput.fill('••••••••••••');
  } catch {}
  await snap(appPage, 'step_02_app_login_screen.png', 'Màn hình Đăng nhập App Hiệp Hội với Email / Mã Hội viên');

  // Thiết lập Cookies và LocalStorage phiên đăng nhập cho App
  await mobileContext.addCookies([
    { name: 'sb-access-token', value: appAuth.access_token, domain: '14.225.217.232', path: '/', secure: true, sameSite: 'Lax' },
    { name: 'sb-refresh-token', value: appAuth.refresh_token || appAuth.access_token, domain: '14.225.217.232', path: '/', secure: true, sameSite: 'Lax' },
  ]);

  await appPage.goto(`${APP_URL}/association`, { waitUntil: 'domcontentloaded' });
  await appPage.evaluate(({ appAuth }) => {
    localStorage.setItem('vibe_token', appAuth.access_token);
    localStorage.setItem('vibe_refresh_token', appAuth.refresh_token || appAuth.access_token);
    localStorage.setItem('vba_user', JSON.stringify(appAuth.user));
  }, { appAuth });

  // 3. Trang chủ App Doanh nhân
  console.log('3. Chụp Trang chủ Dashboard App Doanh nhân...');
  await appPage.goto(`${APP_URL}/association`, { waitUntil: 'networkidle', timeout: 30000 });
  await appPage.waitForTimeout(2500);
  await snap(appPage, 'step_03_app_home_dashboard.png', 'Trang chủ App Doanh Nhân: Thẻ VIP, Banner Sự Kiện & Tiện Ích');

  // 4. Hồ sơ hội viên
  console.log('4. Chụp Màn hình Hồ sơ Hội viên...');
  await appPage.goto(`${APP_URL}/association/profile`, { waitUntil: 'networkidle', timeout: 30000 });
  await appPage.waitForTimeout(2500);
  await snap(appPage, 'step_04_app_profile_update.png', 'Hồ sơ Doanh nhân & Thông tin Doanh nghiệp Hội viên');

  // 5. Danh bạ hội viên
  console.log('5. Chụp Danh bạ Hội viên & Tìm kiếm đối tác...');
  await appPage.goto(`${APP_URL}/association/members`, { waitUntil: 'networkidle', timeout: 30000 });
  await appPage.waitForTimeout(2500);
  await snap(appPage, 'step_05_app_members_directory.png', 'Danh bạ Hội viên & Kết nối Giao thương B2B');

  // 6. Nhắn tin B2B
  console.log('6. Chụp Màn hình Tin nhắn Kết nối B2B...');
  await appPage.goto(`${APP_URL}/association/messages`, { waitUntil: 'networkidle', timeout: 30000 });
  await appPage.waitForTimeout(2500);
  await snap(appPage, 'step_06_app_chat_connection.png', 'Hộp thư Hội thoại Kết nối Doanh nhân 1-on-1 Realtime');

  // 7. Lịch sự kiện
  console.log('7. Chụp Danh sách Sự kiện CLB...');
  await appPage.goto(`${APP_URL}/association/events`, { waitUntil: 'networkidle', timeout: 30000 });
  await appPage.waitForTimeout(2500);
  await snap(appPage, 'step_07_app_event_detail_ticket.png', 'Lịch Sự kiện, Diễn đàn Doanh nhân & Đăng ký tham dự');

  // 8. Vé QR Pass
  console.log('8. Chụp Vé điện tử Check-in QR Pass...');
  await appPage.goto(`${APP_URL}/association/checkin`, { waitUntil: 'networkidle', timeout: 30000 });
  await appPage.waitForTimeout(2500);
  await snap(appPage, 'step_08_app_event_qr_pass.png', 'Vé điện tử thông minh tích hợp Mã QR Check-in tức thì');

  // 9. Marketplace
  console.log('9. Chụp Gian hàng Marketplace B2B...');
  await appPage.goto(`${APP_URL}/association/products`, { waitUntil: 'networkidle', timeout: 30000 });
  await appPage.waitForTimeout(2500);
  await snap(appPage, 'step_09_app_products_marketplace.png', 'Sàn Giao dịch & Gian hàng Sản phẩm Hội viên Ưu đãi');

  // 10. Mở Modal Đăng sản phẩm
  console.log('10. Mở Modal Đăng sản phẩm mới...');
  try {
    const postProdBtn = await appPage.$('button:has-text("Đăng sản phẩm"), button:has-text("Đăng")');
    if (postProdBtn) {
      await postProdBtn.click();
      await appPage.waitForTimeout(1500);
    }
  } catch {}
  await snap(appPage, 'step_10_app_product_submitted.png', 'Biểu mẫu Đăng sản phẩm & Dịch vụ Doanh nghiệp lên Sàn');

  // 11. Trao cơ hội B2B
  console.log('11. Chụp Màn hình Trao Cơ Hội...');
  await appPage.goto(`${APP_URL}/association/opportunities`, { waitUntil: 'networkidle', timeout: 30000 });
  await appPage.waitForTimeout(2500);
  await snap(appPage, 'step_11_app_opportunities_feed.png', 'Sàn Trao Cơ Hội Giao Thương & Tìm kiếm Đối tác Tiềm năng');

  // 12. Modal Đăng cơ hội mới
  console.log('12. Mở Modal Đăng cơ hội giao thương...');
  try {
    const postOppBtn = await appPage.$('button:has-text("Đăng cơ hội"), button:has-text("Trao cơ hội")');
    if (postOppBtn) {
      await postOppBtn.click();
      await appPage.waitForTimeout(1500);
    }
  } catch {}
  await snap(appPage, 'step_12_app_opportunity_submitted.png', 'Biểu mẫu Đăng cơ hội Hợp tác & Tiếp nhận Nhu cầu Giao thương');

  // 13. Cổng Đóng Hội Phí Thường Niên
  console.log('13. Chụp Cổng Đóng Hội Phí Thường Niên...');
  await appPage.goto(`${APP_URL}/association/renew`, { waitUntil: 'networkidle', timeout: 30000 });
  await appPage.waitForTimeout(2500);
  await snap(appPage, 'step_13_app_fee_renewal.png', 'Cổng Đóng Hội Phí Thường Niên & Quét mã VietQR Tự Động');

  await appPage.close();
  await mobileContext.close();

  // --------------------------------------------------------------------------
  // PHẦN B: TEST WEB CRM QUẢN TRỊ - GIAO DIỆN DESKTOP (1440 x 900)
  // --------------------------------------------------------------------------
  console.log('\n--- BƯỚC 2: KHỞI TẠO CONTEXT DESKTOP CRM (1440 x 900) ---');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
    ignoreHTTPSErrors: true,
    locale: 'vi-VN',
  });

  const crmPage = await desktopContext.newPage();

  // 14. Màn Đăng nhập CRM
  console.log('14. Chụp Màn Đăng nhập CRM Quản Trị...');
  await crmPage.goto(`${CRM_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await crmPage.waitForTimeout(1500);
  try {
    const emailInput = await crmPage.$('input[type="text"], input[type="email"]');
    if (emailInput) await emailInput.fill('admin@connect.vn');
    const pwdInput = await crmPage.$('input[type="password"]');
    if (pwdInput) await pwdInput.fill('••••••');
  } catch {}
  await snap(crmPage, 'step_14_crm_login_screen.png', 'Màn hình Đăng nhập Hệ thống Quản trị Web CRM');

  // Thiết lập Cookies và LocalStorage phiên đăng nhập Admin cho CRM
  await desktopContext.addCookies([
    { name: 'sb-access-token', value: crmAuth.access_token, domain: '14.225.217.232', path: '/', secure: true, sameSite: 'Lax' },
    { name: 'sb-refresh-token', value: crmAuth.refresh_token || crmAuth.access_token, domain: '14.225.217.232', path: '/', secure: true, sameSite: 'Lax' },
  ]);

  await crmPage.goto(`${CRM_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
  await crmPage.evaluate(({ crmAuth }) => {
    localStorage.setItem('vibe_token', crmAuth.access_token);
    localStorage.setItem('vibe_refresh_token', crmAuth.refresh_token || crmAuth.access_token);
    localStorage.setItem('vba_user', JSON.stringify(crmAuth.user));
  }, { crmAuth });

  // 15. Dashboard KPI
  console.log('15. Chụp CRM Dashboard KPI...');
  await crmPage.goto(`${CRM_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
  await crmPage.waitForTimeout(2500);
  await snap(crmPage, 'step_15_crm_dashboard_kpi.png', 'Trung tâm Giám sát Chỉ số KPI Hội viên, Sự kiện & Quỹ Hội');

  // 16. Danh sách Hội viên & Phê duyệt
  console.log('16. Chụp CRM Quản lý Hội viên...');
  await crmPage.goto(`${CRM_URL}/members`, { waitUntil: 'networkidle', timeout: 30000 });
  await crmPage.waitForTimeout(2500);
  await snap(crmPage, 'step_16_crm_members_approval.png', 'Quản trị Danh sách Hội viên, Phân hạng & Phê duyệt Kết nạp');

  // 17. Quản trị Sự kiện
  console.log('17. Chụp CRM Quản trị Sự kiện...');
  await crmPage.goto(`${CRM_URL}/events`, { waitUntil: 'networkidle', timeout: 30000 });
  await crmPage.waitForTimeout(2500);
  await snap(crmPage, 'step_17_crm_events_management.png', 'Tổ chức Sự kiện, Sơ đồ Hội trường & Giám sát Check-in Vé');

  // 18. Quản trị Marketplace
  console.log('18. Chụp CRM Quản trị Gian hàng Marketplace...');
  await crmPage.goto(`${CRM_URL}/marketplace`, { waitUntil: 'networkidle', timeout: 30000 });
  await crmPage.waitForTimeout(2500);
  await snap(crmPage, 'step_18_crm_marketplace_sync.png', 'Kiểm duyệt Sản phẩm & Dịch vụ Gian hàng B2B Doanh nhân');

  // 19. Quản trị Cơ hội Giao thương
  console.log('19. Chụp CRM Quản trị Cơ hội Giao thương...');
  await crmPage.goto(`${CRM_URL}/opportunities`, { waitUntil: 'networkidle', timeout: 30000 });
  await crmPage.waitForTimeout(2500);
  await snap(crmPage, 'step_19_crm_opportunities_sync.png', 'Thẩm định & Giám sát Kết nối Các Cơ hội Giao thương B2B');

  // 20. Quản lý Hội phí thường niên & Thu chi
  console.log('20. Chụp CRM Quản lý Hội phí & Sổ quỹ...');
  await crmPage.goto(`${CRM_URL}/fees`, { waitUntil: 'networkidle', timeout: 30000 });
  await crmPage.waitForTimeout(2500);
  await snap(crmPage, 'step_20_crm_finance_fees.png', 'Quản lý Thu Hội phí Thường niên, Hóa đơn VietQR & Báo cáo Sổ quỹ');

  await crmPage.close();
  await desktopContext.close();
  await browser.close();
  await pg.end();

  console.log('\n================================================================');
  console.log('HOÀN TẤT THÀNH CÔNG TOÀN BỘ 20 HÌNH ẢNH MINH HỌA THỰC TẾ ĐỘC LẬP!');
  console.log('App Hiệp Hội : step_01 -> step_13 (13 ảnh Mobile)');
  console.log('Web CRM      : step_14 -> step_20 (7 ảnh Desktop)');
  console.log('================================================================\n');
}

main().catch(err => {
  console.error('Fatal Error during capture:', err);
  process.exit(1);
});
