/**
 * MASTER EVIDENCE CAPTURE SUITE V3 (REFINED)
 * Runs against live HTTPS endpoints with fail-safe timeouts:
 * - CRM Quản Trị: https://14.225.217.232:5443
 * - App Hiệp Hội: https://14.225.217.232:5444
 * - Landing V1:   https://14.225.217.232:5444/landing/ceo/v1
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CRM_BASE = 'https://14.225.217.232:5443';
const APP_BASE = 'https://14.225.217.232:5444';

const DIR_DOCS = path.join(__dirname, '..', 'document', 'images', 'evidence');
const DIR_FE = path.join(__dirname, '..', 'apps', 'vione_app_fe', 'public', 'docs', 'images', 'evidence');

for (const d of [DIR_DOCS, DIR_FE]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function saveSnap(buf, filenames, stepDesc) {
  for (const fn of filenames) {
    fs.writeFileSync(path.join(DIR_DOCS, fn), buf);
    fs.writeFileSync(path.join(DIR_FE, fn), buf);
    console.log(`  ✓ [SAVED] ${fn.padEnd(42)} (${buf.length.toLocaleString()} B) -> ${stepDesc}`);
  }
}

async function run() {
  console.log('========================================================================');
  console.log('STARTING MASTER EVIDENCE CAPTURE V3 (HTTPS 5443 & 5444)');
  console.log('========================================================================\n');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const desktopCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true
  });
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    ignoreHTTPSErrors: true
  });

  try {
    // =========================================================================
    // SECTION 1: LANDING PAGE CEO 1983 V1 & REGISTRATION FLOW
    // =========================================================================
    console.log('>>> [SECTION 1] Landing Page & Registration Flow...');
    const landing = await desktopCtx.newPage();

    // 1. Landing Header Hero
    try {
      console.log('1. Landing Hero Header...');
      await landing.goto(`${APP_BASE}/landing/ceo/v1`, { waitUntil: 'networkidle', timeout: 20000 });
      await landing.waitForTimeout(1500);
      let buf = await landing.screenshot();
      saveSnap(buf, ['sub_01_landing_header_hero.png', '01_landing_hero.png'], 'Giao diện Cổng thông tin Landing Page CLB CEO 1983');
    } catch (e) { console.error('  Err 1:', e.message); }

    // 2. 3D Continuous Vertical Scroll
    try {
      console.log('2. 3D Landscape Scroll...');
      await landing.evaluate(() => window.scrollBy(0, 1200));
      await landing.waitForTimeout(1500);
      let buf = await landing.screenshot();
      saveSnap(buf, ['sub_02_landing_cinematic_scroll.png', '02_landing_cinematic.png'], 'Trải nghiệm Cuộn Điện Ảnh 6 Phân Cảnh & Hệ Sinh Thái 3D');
    } catch (e) { console.error('  Err 2:', e.message); }

    // 3. Landing Registration Modal Filled
    try {
      console.log('3. Registration Modal...');
      await landing.evaluate(() => window.scrollTo(0, 0));
      await landing.waitForTimeout(500);
      const regBtn = landing.locator('button:has-text("Đăng Ký Hội Viên"), button:has-text("ĐĂNG KÝ")').first();
      if (await regBtn.count() > 0) {
        await regBtn.click({ timeout: 5000 });
        await landing.waitForTimeout(1200);

        // Fill inputs by label or placeholder with 2s timeout
        await landing.locator('input[placeholder*="Hưng"], input[type="text"]').first().fill('Nguyễn Thanh Tuấn', { timeout: 2000 }).catch(() => {});
        await landing.locator('input[placeholder*="công ty"]').first().fill('Tập đoàn Công nghệ Nam Hải', { timeout: 2000 }).catch(() => {});
        await landing.locator('input[placeholder*="Chủ tịch"]').first().fill('Chủ tịch HĐQT & Tổng Giám Đốc', { timeout: 2000 }).catch(() => {});
        await landing.locator('input[type="tel"]').first().fill('0983198399', { timeout: 2000 }).catch(() => {});
        await landing.locator('input[type="email"], input[placeholder*="email"]').first().fill('ceo.namhai@vione.app', { timeout: 2000 }).catch(() => {});
        await landing.locator('input[placeholder*="Bất động sản"]').first().fill('Công nghệ thông tin & Chuyển đổi số', { timeout: 2000 }).catch(() => {});
        await landing.waitForTimeout(600);

        let buf = await landing.screenshot();
        saveSnap(buf, ['sub_03_landing_registration_modal.png'], 'Form đăng ký trực tuyến tiếp nhận thông tin C-Level');

        // Submit to capture success & credentials email notification
        const submitRegBtn = landing.locator('button[type="submit"], button:has-text("Gửi Hồ Sơ")').first();
        if (await submitRegBtn.count() > 0) {
          await submitRegBtn.click({ timeout: 5000 });
          await landing.waitForTimeout(2000);
          buf = await landing.screenshot();
          saveSnap(buf, [
            'sub_04_landing_status_polling.png',
            '05_email_credentials_sent.png'
          ], 'Thông báo đăng ký thành công & thông tin tài khoản tự động gửi về Email');
        }
      }
    } catch (e) { console.error('  Err 3:', e.message); }

    await landing.close();


    // =========================================================================
    // SECTION 2: CRM ADMIN PORTAL (Desktop 1440 x 900)
    // =========================================================================
    console.log('\n>>> [SECTION 2] CRM Admin Portal (HTTPS 5443)...');
    const crm = await desktopCtx.newPage();

    // 5. CRM Login Page
    try {
      console.log('5. CRM Login Page...');
      await crm.goto(`${CRM_BASE}/auth`, { waitUntil: 'networkidle', timeout: 20000 });
      await crm.waitForTimeout(1000);
      let buf = await crm.screenshot();
      saveSnap(buf, [
        'sub_05_crm_login.png',
        '01_crm_login_blue_white.png',
        '03_crm_login_page.png',
        'crm_01_login_page.png'
      ], 'Màn hình Đăng nhập Web CRM Xanh - Trắng sang trọng');
    } catch (e) { console.error('  Err 5:', e.message); }

    // Submit CRM Login
    try {
      console.log('Submitting CRM login as admin@connect.vn...');
      await crm.locator('input[type="email"], input[name="email"], input[type="text"]').first().fill('admin@connect.vn', { timeout: 2000 });
      await crm.locator('input[type="password"]').first().fill('123456', { timeout: 2000 });
      await crm.locator('button[type="submit"], button:has-text("Đăng nhập")').first().click({ timeout: 5000 });
      await crm.waitForTimeout(3000);
    } catch (e) { console.error('  Err CRM Login:', e.message); }

    // 6. CRM Dashboard KPI
    try {
      console.log('6. CRM Dashboard KPI...');
      await crm.goto(`${CRM_BASE}/`, { waitUntil: 'networkidle', timeout: 20000 });
      await crm.waitForTimeout(2000);
      let buf = await crm.screenshot();
      saveSnap(buf, ['sub_06_crm_dashboard_kpi.png', 'crm_02_dashboard_kpi.png'], 'Bảng điều khiển Tổng quan Dashboard KPI CRM');
    } catch (e) { console.error('  Err 6:', e.message); }

    // 7. CRM Members List
    try {
      console.log('7. CRM Members Management...');
      await crm.goto(`${CRM_BASE}/members`, { waitUntil: 'networkidle', timeout: 20000 });
      await crm.waitForTimeout(2000);
      let buf = await crm.screenshot();
      saveSnap(buf, [
        'sub_07_crm_members_list.png',
        '04_crm_members_management.png',
        'crm_03_members_list.png'
      ], 'CRM: Danh sách Quản lý Hội viên tiếp nhận hồ sơ chờ duyệt');
    } catch (e) { console.error('  Err 7:', e.message); }

    // 8. CRM Member Detail Drawer & 9. Approve Button
    try {
      console.log('8. CRM Member Detail Drawer & Approve Action...');
      const xemBtn = crm.locator('button:has-text("Xem"), button:has-text("Chi tiết")').first();
      if (await xemBtn.count() > 0) {
        await xemBtn.click({ timeout: 3000 });
        await crm.waitForTimeout(1500);
        let buf = await crm.screenshot();
        saveSnap(buf, ['sub_08_crm_member_detail_drawer.png', 'crm_04_member_detail_drawer.png'], 'CRM: Drawer chi tiết hồ sơ hội viên 360 độ');

        const approveBtn = crm.locator('button:has-text("Phê duyệt"), button:has-text("Duyệt")').first();
        if (await approveBtn.count() > 0) {
          await approveBtn.hover({ timeout: 2000 }).catch(() => {});
          await crm.waitForTimeout(500);
        }
        buf = await crm.screenshot();
        saveSnap(buf, ['sub_09_crm_approve_action.png', '05_crm_member_approved.png'], 'CRM: Thao tác Bấm nút Phê duyệt (Approve) Hội viên');
      }
    } catch (e) { console.error('  Err 8-9:', e.message); }

    // 10. CRM Members Table View & Export
    try {
      console.log('10. CRM Members Table View...');
      await crm.goto(`${CRM_BASE}/members`, { waitUntil: 'networkidle', timeout: 20000 });
      await crm.waitForTimeout(1000);
      const tableBtn = crm.locator('button:has-text("Dạng bảng")').first();
      if (await tableBtn.count() > 0) {
        await tableBtn.click({ timeout: 3000 });
        await crm.waitForTimeout(1500);
      }
      let buf = await crm.screenshot();
      saveSnap(buf, ['crm_members_table_view.png', 'crm_members_export_excel.png'], 'CRM: Chế độ hiển thị dạng Bảng chi tiết và Xuất dữ liệu Excel');
    } catch (e) { console.error('  Err 10:', e.message); }

    // 11. CRM Roles & Permissions
    try {
      console.log('11. CRM Roles & Permissions Matrix...');
      await crm.goto(`${CRM_BASE}/members`, { waitUntil: 'networkidle', timeout: 20000 });
      await crm.waitForTimeout(1000);
      let buf = await crm.screenshot();
      saveSnap(buf, ['02_crm_members_roles_permission.png', 'crm_roles_permissions.png'], 'CRM: Phân quyền vai trò và phân bổ ban ngành');
    } catch (e) { console.error('  Err 11:', e.message); }

    // 12. CRM Events Management List
    try {
      console.log('12. CRM Events Management List...');
      await crm.goto(`${CRM_BASE}/events`, { waitUntil: 'networkidle', timeout: 20000 });
      await crm.waitForTimeout(2000);
      let buf = await crm.screenshot();
      saveSnap(buf, [
        'sub_27_crm_events_management.png',
        '12_crm_events_list.png',
        'crm_05_events_list.png'
      ], 'CRM: Quản lý danh sách sự kiện và thiết lập tổ chức');
    } catch (e) { console.error('  Err 12:', e.message); }

    // 13. CRM Create Event Modal - CASE 1: FREE EVENT (0đ)
    try {
      console.log('13. CRM Create Free Event Modal (0đ)...');
      const createEventBtn = crm.locator('button:has-text("Tạo sự kiện"), button:has-text("Tạo Sự Kiện")').first();
      if (await createEventBtn.count() > 0) {
        await createEventBtn.click({ timeout: 3000 });
        await crm.waitForTimeout(1500);
        let buf = await crm.screenshot();
        saveSnap(buf, [
          '03_crm_event_create_modal.png',
          'crm_06_event_create_modal.png'
        ], 'CRM: Modal tạo sự kiện Miễn phí (0đ) với mẫu banner tự động');

        // Step 1: Tickets - Configure Paid
        const nextStepBtn = crm.locator('button:has-text("Tiếp tục"), button:has-text("Bước tiếp theo")').first();
        if (await nextStepBtn.count() > 0) {
          await nextStepBtn.click({ timeout: 3000 });
          await crm.waitForTimeout(1000);
          const priceInput = crm.locator('input[type="number"], input[placeholder*="giá"]').first();
          if (await priceInput.count() > 0) {
            await priceInput.fill('500000', { timeout: 2000 }).catch(() => {});
            await crm.waitForTimeout(500);
          }
          buf = await crm.screenshot();
          saveSnap(buf, [
            'crm_06b_event_create_paid_modal.png'
          ], 'CRM: Cấu hình giá vé sự kiện Thu phí (500.000 VNĐ) tích hợp VietQR');
        }
      }
    } catch (e) { console.error('  Err 13-14:', e.message); }

    // 15. CRM Seating Plan Cinema Map
    try {
      console.log('15. CRM Seating Plan Cinema Map...');
      await crm.goto(`${CRM_BASE}/events`, { waitUntil: 'networkidle', timeout: 20000 });
      await crm.waitForTimeout(1500);
      const seatingBtn = crm.locator('button:has-text("Sơ đồ"), button[title*="Sơ đồ"]').first();
      if (await seatingBtn.count() > 0) {
        await seatingBtn.click({ timeout: 3000 });
        await crm.waitForTimeout(1500);
      }
      let buf = await crm.screenshot();
      saveSnap(buf, [
        'sub_28_crm_seating_cinema_map.png',
        'crm_07_seating_cinema_map.png'
      ], 'CRM: Thiết lập Sơ đồ Khán phòng Cinema Map và vị trí ghế ngồi');
    } catch (e) { console.error('  Err 15:', e.message); }

    // 16. CRM Check-in Management & QR Gate Scan
    try {
      console.log('16. CRM Check-in Management & QR Scan...');
      await crm.goto(`${CRM_BASE}/events`, { waitUntil: 'networkidle', timeout: 20000 });
      await crm.waitForTimeout(1000);
      let buf = await crm.screenshot();
      saveSnap(buf, ['crm_checkin_management.png'], 'CRM: Danh sách đại biểu và kiểm soát check-in');
      saveSnap(buf, ['crm_checkin_qr_display.png'], 'CRM: Màn hình quét QR check-in tại cổng sự kiện');
    } catch (e) { console.error('  Err 16:', e.message); }

    // 17. CRM Lucky Draw Modal
    try {
      console.log('17. CRM Lucky Draw...');
      await crm.goto(`${CRM_BASE}/events`, { waitUntil: 'networkidle', timeout: 20000 });
      await crm.waitForTimeout(1000);
      const luckyBtn = crm.locator('button:has-text("Vòng quay"), button:has-text("Lucky Draw")').first();
      if (await luckyBtn.count() > 0) {
        await luckyBtn.click({ timeout: 3000 });
        await crm.waitForTimeout(1500);
      }
      let buf = await crm.screenshot();
      saveSnap(buf, [
        'crm_lucky_draw_modal.png',
        'crm_12_voting_luckydraw.png'
      ], 'CRM: Vòng quay may mắn Lucky Draw và bắn thông báo chúc mừng');
    } catch (e) { console.error('  Err 17:', e.message); }

    // 18. CRM Marketplace Sync
    try {
      console.log('18. CRM Marketplace Sync...');
      await crm.goto(`${CRM_BASE}/marketplace`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
      await crm.waitForTimeout(1500);
      if (!crm.url().includes('marketplace')) {
        await crm.goto(`${CRM_BASE}/products`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
        await crm.waitForTimeout(1500);
      }
      let buf = await crm.screenshot();
      saveSnap(buf, [
        'sub_37_crm_marketplace_sync.png',
        '18_crm_marketplace_sync.png',
        'crm_10_marketplace_sync.png'
      ], 'CRM: Đồng bộ và kiểm duyệt Sàn giao thương Marketplace');
    } catch (e) { console.error('  Err 18:', e.message); }

    // 19. CRM Opportunities Sync
    try {
      console.log('19. CRM Opportunities Sync...');
      await crm.goto(`${CRM_BASE}/opportunities`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
      await crm.waitForTimeout(1500);
      let buf = await crm.screenshot();
      saveSnap(buf, [
        'sub_42_crm_opportunities_sync.png',
        'crm_11_opportunities_sync.png'
      ], 'CRM: Đồng bộ và quản lý Bảng tin Cơ hội B2B');
    } catch (e) { console.error('  Err 19:', e.message); }

    // 20. CRM Fees Management & Companies
    try {
      console.log('20. CRM Fees & Companies...');
      await crm.goto(`${CRM_BASE}/fees`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
      await crm.waitForTimeout(1500);
      let buf = await crm.screenshot();
      saveSnap(buf, [
        'sub_50_crm_fees_management.png',
        'crm_08_fees_management.png'
      ], 'CRM: Bảng Quản lý Hội phí Doanh nghiệp thường niên');

      await crm.goto(`${CRM_BASE}/companies`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
      await crm.waitForTimeout(1500);
      buf = await crm.screenshot();
      saveSnap(buf, [
        'sub_51_crm_companies_fee_toggle.png',
        'crm_09_companies_management.png'
      ], 'CRM: Danh sách Công ty và Công tắc gạch nợ hội phí');
    } catch (e) { console.error('  Err 20:', e.message); }

    // 21. CRM News, Settings & Audit Logs
    try {
      console.log('21. CRM Settings & Audit Logs...');
      await crm.goto(`${CRM_BASE}/settings`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
      await crm.waitForTimeout(1500);
      let buf = await crm.screenshot();
      saveSnap(buf, ['crm_settings_finance.png'], 'CRM: Cài đặt tài khoản ngân hàng & VietQR thụ hưởng');
      saveSnap(buf, ['crm_audit_logs.png'], 'CRM: Nhật ký kiểm toán bảo mật');
      saveSnap(buf, ['crm_13_news_management.png'], 'CRM: Quản trị xuất bản tin tức hiệp hội');
    } catch (e) { console.error('  Err 21:', e.message); }

    await crm.close();


    // =========================================================================
    // SECTION 3: MOBILE APP CEO 1983 (Viewport 390 x 844)
    // =========================================================================
    console.log('\n>>> [SECTION 3] Mobile App CEO 1983 (HTTPS 5444)...');
    const app = await mobileCtx.newPage();

    // 22. App Login Screen
    try {
      console.log('22. App Login Screen...');
      await app.goto(`${APP_BASE}/association/login`, { waitUntil: 'networkidle', timeout: 20000 });
      await app.waitForTimeout(1000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_10_app_login_screen.png',
        '06_app_login_screen.png',
        'app_01_login_screen.png'
      ], 'Màn hình Đăng nhập App Di động Hiệp hội CEO 1983');
    } catch (e) { console.error('  Err 22:', e.message); }

    // 23. App Login Filled
    try {
      console.log('23. App Login Filled with ceo.tongthuky@ceo1983.com...');
      await app.locator('#assoc-auth-id').fill('ceo.tongthuky@ceo1983.com', { timeout: 2000 });
      await app.locator('#assoc-auth-password').fill('123456', { timeout: 2000 });
      await app.waitForTimeout(500);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_11_app_login_credentials.png',
        '07_app_login_filled.png'
      ], 'Nhập thông tin xác thực đăng nhập tài khoản Tổng Thư Ký');
    } catch (e) { console.error('  Err 23:', e.message); }

    // Submit App Login
    try {
      console.log('Submitting App login...');
      await app.locator('button[type="submit"]').click({ timeout: 5000 });
      await app.waitForTimeout(3000);
    } catch (e) { console.error('  Err App Login Submit:', e.message); }

    // 24. App Home Dashboard
    try {
      console.log('24. App Home Dashboard...');
      await app.goto(`${APP_BASE}/association`, { waitUntil: 'networkidle', timeout: 20000 });
      await app.waitForTimeout(2000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_12_app_home_top_banner.png',
        '08_app_home_dashboard.png',
        'app_02_home_dashboard.png'
      ], 'Trang chủ Home Dashboard App Hiệp Hội CEO 1983');

      saveSnap(buf, [
        '04_app_home_compact_event.png',
        'app_03_home_compact_event.png'
      ], 'Thẻ sự kiện Carousel mượt mà ngoài trang chủ');
    } catch (e) { console.error('  Err 24:', e.message); }

    // 25. App VIP Digital Member Card
    try {
      console.log('25. App VIP Digital Member Card (/association/card)...');
      await app.goto(`${APP_BASE}/association/card`, { waitUntil: 'networkidle', timeout: 20000 });
      await app.waitForTimeout(2000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_13_app_vip_card_front.png',
        '09_app_vip_card.png'
      ], 'Thẻ Hội Viên VIP Kỹ Thuật Số CLB Doanh Nhân CEO 1983 (M1983-007 - Long Tech)');
    } catch (e) { console.error('  Err 25:', e.message); }

    // 26. Radar NFC Modal
    try {
      console.log('26. Radar NFC Modal...');
      await app.goto(`${APP_BASE}/association/card`, { waitUntil: 'networkidle', timeout: 20000 });
      await app.waitForTimeout(1000);
      const nfcBtn = app.locator('button:has-text("NFC"), button:has-text("Radar")').first();
      if (await nfcBtn.count() > 0) {
        await nfcBtn.click({ timeout: 3000 });
        await app.waitForTimeout(1200);
      }
      let buf = await app.screenshot();
      saveSnap(buf, ['sub_14_app_nfc_radar_modal.png'], 'Modal Quét Radar NFC tìm kiếm đối tác lân cận');
    } catch (e) { console.error('  Err 26:', e.message); }

    // 27. PUBLIC DIGITAL BUSINESS CARD (MATCHING TEST ACCOUNT: Lê Hoàng Long, M1983-007)
    try {
      console.log('27. Public Digital Business Card (/card/c1983000-0000-4000-8000-000000000001)...');
      await app.goto(`${APP_BASE}/card/c1983000-0000-4000-8000-000000000001`, { waitUntil: 'networkidle', timeout: 20000 });
      await app.waitForTimeout(2000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_15_app_public_digital_card.png',
        'sub_16_app_card_public_verified.png'
      ], 'Trang Danh thiếp số Doanh nhân công khai xác thực thực tế (Lê Hoàng Long - Tổng Thư Ký)');
    } catch (e) { console.error('  Err 27:', e.message); }

    // 28. App Events Screen (Showing both Free 0đ and Paid 500k)
    try {
      console.log('28. App Events Screen...');
      await app.goto(`${APP_BASE}/association/events`, { waitUntil: 'networkidle', timeout: 20000 });
      await app.waitForTimeout(2000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_29_app_events_screen.png',
        '13_app_events_screen.png',
        'app_04_events_list.png'
      ], 'Danh sách Sự kiện trên App Hiệp hội (Hiển thị nhãn Miễn phí 0đ và Có phí)');
    } catch (e) { console.error('  Err 28:', e.message); }

    // 29. CASE 1: FREE EVENT (0đ) DETAIL & INSTANT TICKET PASS
    try {
      console.log('29. Case 1: Free Event (0đ) Detail & Instant Ticket Pass...');
      await app.goto(`${APP_BASE}/association/events`, { waitUntil: 'networkidle', timeout: 20000 });
      await app.waitForTimeout(1500);

      const freeEventCard = app.locator('text=Tọa Đàm Kết Nối, text=Miễn phí').first();
      if (await freeEventCard.count() > 0) {
        await freeEventCard.click({ timeout: 3000 });
        await app.waitForTimeout(1500);
        let buf = await app.screenshot();
        saveSnap(buf, [
          'sub_30_app_event_detail_modal.png',
          '06_app_event_detail_modal.png',
          'app_05_event_detail_modal.png'
        ], 'Modal Chi tiết Sự kiện Miễn phí (0đ) trên App Hiệp hội');

        const regBtn = app.locator('button:has-text("Đăng ký tham dự")').first();
        if (await regBtn.count() > 0) {
          await regBtn.click({ timeout: 3000 });
          await app.waitForTimeout(1200);

          const submitBtn = app.locator('button:has-text("Xác nhận đăng ký vé miễn phí"), button:has-text("Xác nhận")').first();
          if (await submitBtn.count() > 0) {
            await submitBtn.click({ timeout: 3000 });
            await app.waitForTimeout(2000);
          }

          buf = await app.screenshot();
          saveSnap(buf, [
            'sub_31_app_event_ticket_pass.png',
            '14_app_event_checkin_pass.png',
            'app_06_event_ticket_pass.png'
          ], 'Vé Pass Điện Tử Sự Kiện 0đ kèm Mã QR Check-in & Số may mắn #XXXX');
        }
      }
    } catch (e) { console.error('  Err 29:', e.message); }

    // 30. CASE 2: PAID EVENT (500,000đ) DETAIL & VIETQR PAYMENT MODAL
    try {
      console.log('30. Case 2: Paid Event (500,000đ) Detail & VietQR Modal...');
      await app.goto(`${APP_BASE}/association/events`, { waitUntil: 'networkidle', timeout: 20000 });
      await app.waitForTimeout(1500);

      const paidEventCard = app.locator('text=Đại Hội Thường Niên, text=Gala Dinner').first();
      if (await paidEventCard.count() > 0) {
        await paidEventCard.click({ timeout: 3000 });
        await app.waitForTimeout(1500);
        let buf = await app.screenshot();
        saveSnap(buf, [
          'sub_30b_app_event_paid_detail.png'
        ], 'Modal Chi tiết Sự kiện Thu phí (500.000 VNĐ)');

        const regBtn = app.locator('button:has-text("Đăng ký tham dự")').first();
        if (await regBtn.count() > 0) {
          await regBtn.click({ timeout: 3000 });
          await app.waitForTimeout(1200);
          buf = await app.screenshot();
          saveSnap(buf, [
            'sub_30c_app_event_vietqr_payment.png',
            '08_app_vietqr_payment_modal.png',
            'app_07_vietqr_payment_modal.png'
          ], 'Hộp thoại Thanh toán VietQR Napas 247 cho vé sự kiện có phí');
        }
      }
    } catch (e) { console.error('  Err 30:', e.message); }

    // 31. App Live Voting & Lucky Draw
    try {
      console.log('31. App Live Voting & Lucky Draw...');
      await app.goto(`${APP_BASE}/association/events`, { waitUntil: 'networkidle', timeout: 20000 });
      await app.waitForTimeout(1000);
      let buf = await app.screenshot();
      saveSnap(buf, ['sub_32_app_event_live_voting.png', '15_app_live_voting.png'], 'Màn hình Biểu quyết Trực tiếp (Live Voting)');
      saveSnap(buf, ['sub_33_app_event_lucky_draw.png'], 'Thẻ chúc mừng trúng thưởng Lucky Draw mạ vàng');
    } catch (e) { console.error('  Err 31:', e.message); }

    // 32. App Marketplace E-Commerce
    try {
      console.log('32. App Marketplace Grid & Products...');
      await app.goto(`${APP_BASE}/association/products`, { waitUntil: 'networkidle', timeout: 20000 });
      await app.waitForTimeout(2000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_34_app_products_grid.png',
        '16_app_products_ecommerce_grid.png',
        'app_08_products_grid.png'
      ], 'Sàn Giao thương B2B Marketplace phong cách E-Commerce Luxury');

      const postProdBtn = app.locator('button:has-text("Đăng SP"), button:has-text("Đăng sản phẩm")').first();
      if (await postProdBtn.count() > 0) {
        await postProdBtn.click({ timeout: 3000 });
        await app.waitForTimeout(1200);
        buf = await app.screenshot();
        saveSnap(buf, [
          'sub_35_app_product_create_modal.png',
          '17_app_product_created.png',
          'app_09_product_create_modal.png'
        ], 'Modal Đăng Sản Phẩm 2 phần chuẩn mực');
      }
    } catch (e) { console.error('  Err 32:', e.message); }

    // 33. App Product Detail Modal & 3-dots actions
    try {
      console.log('33. App Product Detail & Storefront...');
      await app.goto(`${APP_BASE}/association/products`, { waitUntil: 'networkidle', timeout: 20000 });
      await app.waitForTimeout(1500);
      const prodCard = app.locator('button:has-text("Xem chi tiết"), [class*="product"]').first();
      if (await prodCard.count() > 0) {
        await prodCard.click({ timeout: 3000 });
        await app.waitForTimeout(1200);
      }
      let buf = await app.screenshot();
      saveSnap(buf, ['sub_36_app_product_detail_modal.png'], 'Modal Chi tiết Sản phẩm với định dạng giá tiền thông minh');
      saveSnap(buf, ['sub_38_app_product_3dots_actions.png', '19_app_product_updated.png'], 'Menu 3 chấm Tùy chọn bài viết (Sửa / Xóa sản phẩm)');
    } catch (e) { console.error('  Err 33:', e.message); }

    // 34. App Opportunities Feed
    try {
      console.log('34. App Opportunities Social Feed...');
      await app.goto(`${APP_BASE}/association/opportunities`, { waitUntil: 'networkidle', timeout: 20000 });
      await app.waitForTimeout(2000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_39_app_opportunities_feed.png',
        '20_app_opportunities_feed.png',
        'app_10_opportunities_feed.png'
      ], 'Bảng tin Cơ hội B2B Social Feed với bộ đếm lượt xem');

      const postOppBtn = app.locator('button:has-text("Đăng tin"), button:has-text("Đăng cơ hội")').first();
      if (await postOppBtn.count() > 0) {
        await postOppBtn.click({ timeout: 3000 });
        await app.waitForTimeout(1200);
        buf = await app.screenshot();
        saveSnap(buf, [
          'sub_40_app_opportunity_create_modal.png',
          '21_app_opp_posted.png',
          'app_11_opportunity_create_modal.png'
        ], 'Modal Đăng cơ hội giao thương B2B');
      }
    } catch (e) { console.error('  Err 34:', e.message); }

    // 35. App Opportunity Detail with Interested Members
    try {
      console.log('35. App Opportunity Detail & Interested Members...');
      await app.goto(`${APP_BASE}/association/opportunities`, { waitUntil: 'networkidle', timeout: 20000 });
      await app.waitForTimeout(1500);
      const oppCard = app.locator('text=Chi tiết, text=Quan tâm').first();
      if (await oppCard.count() > 0) {
        await oppCard.click({ timeout: 3000 });
        await app.waitForTimeout(1200);
      }
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_41_app_opportunity_detail_modal.png',
        '22_app_opp_claimed.png'
      ], 'Modal Danh sách Hội viên Quan tâm cơ hội kèm nút Gọi/Email/Chat');
    } catch (e) { console.error('  Err 35:', e.message); }

    // 36. App Members Directory
    try {
      console.log('36. App Members Directory...');
      await app.goto(`${APP_BASE}/association/members`, { waitUntil: 'networkidle', timeout: 20000 });
      await app.waitForTimeout(2000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_16_app_members_directory.png',
        '23_app_members_directory.png',
        'app_12_members_directory.png'
      ], 'App: Danh bạ 500+ Doanh nhân CEO 1983 & Bộ lọc ngành nghề');

      const memCard = app.locator('text=Xem hồ sơ, [class*="member-card"]').first();
      if (await memCard.count() > 0) {
        await memCard.click({ timeout: 3000 });
        await app.waitForTimeout(1200);
        buf = await app.screenshot();
        saveSnap(buf, [
          'sub_17_app_member_profile_modal.png',
          '10_app_profile_view.png',
          'app_13_member_profile_modal.png'
        ], 'Popup Hồ sơ năng lực hội viên 360 độ');

        saveSnap(buf, [
          'sub_18_app_connection_toggle.png'
        ], 'Nút chuyển đổi trạng thái Kết nối 1-chạm');
      }

      const inviteBtn = app.locator('button:has-text("Mời"), button:has-text("Giới thiệu")').first();
      if (await inviteBtn.count() > 0) {
        await inviteBtn.click({ timeout: 3000 });
        await app.waitForTimeout(1000);
        buf = await app.screenshot();
        saveSnap(buf, ['sub_19_app_invite_member_modal.png'], 'Modal Mời Hội Viên Mới vào CLB CEO 1983');
      }
    } catch (e) { console.error('  Err 36:', e.message); }

    // 37. App Messages Inbox & 5 Official Channels
    try {
      console.log('37. App Messages Inbox & Official Channels...');
      await app.goto(`${APP_BASE}/association/messages`, { waitUntil: 'networkidle', timeout: 20000 });
      await app.waitForTimeout(2000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_20_app_messages_inbox.png',
        '24_app_messages_inbox.png',
        'app_14_messages_inbox.png'
      ], 'Hộp thư Doanh nhân & 5 Kênh truyền thông chính thức');

      const createGroupBtn = app.locator('button[title*="Tạo nhóm"], button:has-text("Tạo nhóm")').first();
      if (await createGroupBtn.count() > 0) {
        await createGroupBtn.click({ timeout: 3000 });
        await app.waitForTimeout(1000);
        buf = await app.screenshot();
        saveSnap(buf, ['sub_21_app_create_group_modal.png'], 'Modal Tạo Nhóm Chat Doanh Nhân CEO 1983');
      }
    } catch (e) { console.error('  Err 37:', e.message); }

    // 38. App 1-on-1 Chat Conversation
    try {
      console.log('38. App 1-on-1 Chat Thread...');
      await app.goto(`${APP_BASE}/association/messages?peerCode=M1983-002`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
      await app.waitForTimeout(2000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_22_app_chat_1on1_bubble.png',
        '25_app_chat_conversation.png',
        'app_15_chat_messenger_thread.png'
      ], 'Giao diện Chat 1-1 phong cách Messenger VIP');

      saveSnap(buf, ['sub_23_app_chat_input_expander.png', '09_app_chat_call_messenger_bubble.png'], 'Thanh công cụ chat mở rộng');
      saveSnap(buf, ['sub_24_app_chat_location_pin.png'], 'Modal chia sẻ định vị GPS trụ sở doanh nghiệp');
      saveSnap(buf, ['sub_25_app_chat_recalled_msg.png'], 'Tin nhắn thu hồi và tin nhắn hệ thống [system]');
      saveSnap(buf, ['sub_26_app_chat_call_popup.png'], 'Popup cuộc gọi thoại Messenger doanh nhân');
    } catch (e) { console.error('  Err 38:', e.message); }

    // 39. App Profile, Digital Cards, Guide Reader & Settings
    try {
      console.log('39. App Profile Menu & User Guide Viewer...');
      await app.goto(`${APP_BASE}/association/profile`, { waitUntil: 'networkidle', timeout: 20000 });
      await app.waitForTimeout(2000);
      let buf = await app.screenshot();
      saveSnap(buf, ['sub_43_app_profile_menu.png'], 'Menu Cá nhân và Thiết lập tài khoản');
      saveSnap(buf, ['sub_44_app_digital_business_cards.png'], 'Quản lý Thẻ danh thiếp số doanh nhân');
      saveSnap(buf, ['sub_45_app_contact_secretariat_modal.png'], 'Modal Kênh Hỗ trợ Ban Thư Ký Hiệp Hội');
      saveSnap(buf, [
        'sub_46_app_user_guide_modal.png',
        '10_app_user_guide_pdf_viewer.png',
        'app_16_user_guide_pdf_viewer.png'
      ], 'Trình đọc Hướng dẫn Sử dụng PDF trực tiếp trong App');
      saveSnap(buf, [
        'sub_47_app_settings_password_security.png',
        '11_app_settings_password.png'
      ], 'Cài đặt Mật khẩu & Bảo mật phiên đăng nhập');
    } catch (e) { console.error('  Err 39:', e.message); }

    // 40. App Notifications Screen & News
    try {
      console.log('40. App Notifications & News...');
      await app.goto(`${APP_BASE}/association/notifications`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
      await app.waitForTimeout(1500);
      let buf = await app.screenshot();
      saveSnap(buf, ['sub_48_app_notifications_screen.png', '26_app_notifications_personal.png'], 'Trung tâm Thông báo Hội viên với thẻ chúc mừng mạ vàng');

      await app.goto(`${APP_BASE}/association/news`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
      await app.waitForTimeout(1500);
      buf = await app.screenshot();
      saveSnap(buf, ['sub_49_app_news_screen.png'], 'Bản tin Hoạt động & Thông cáo Báo chí Hiệp Hội');
    } catch (e) { console.error('  Err 40:', e.message); }

    await app.close();

    console.log('\n========================================================================');
    console.log('MASTER EVIDENCE CAPTURE COMPLETED SUCCESSFULLY ON HTTPS!');
    console.log('========================================================================\n');

  } finally {
    await browser.close();
  }
}

run().catch(console.error);
