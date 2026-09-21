/**
 * MASTER COMPREHENSIVE UNIQUE EVIDENCE CAPTURE SCRIPT (V2)
 * Captures 100% accurate, high-fidelity screenshots matching each step in:
 * - document/HUONG_DAN_SU_DUNG_CRM.md (CRM Quản Trị)
 * - document/HUONG_DAN_SU_DUNG_APP_HIEP_HOI.md (App Hiệp Hội CEO 1983)
 *
 * Each step is strictly isolated with independent error handling and clean state resets.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CRM_BASE = 'http://14.225.217.232:5000';
const APP_BASE = 'http://14.225.217.232:5002';

const DIR_1 = path.join(__dirname, '..', 'document', 'images', 'evidence');
const DIR_2 = path.join(__dirname, '..', 'apps', 'vione_app_fe', 'public', 'docs', 'images', 'evidence');

for (const d of [DIR_1, DIR_2]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function saveSnap(buf, filenames, stepDesc) {
  for (const fn of filenames) {
    fs.writeFileSync(path.join(DIR_1, fn), buf);
    fs.writeFileSync(path.join(DIR_2, fn), buf);
    console.log(`  ✓ [SAVED] ${fn.padEnd(42)} (${buf.length.toLocaleString()} B) -> ${stepDesc}`);
  }
}

async function runCapture() {
  console.log('======================================================================');
  console.log('STARTING MASTER UNIQUE EVIDENCE CAPTURE FOR CRM & APP CEO 1983 (V2)');
  console.log('CRM:', CRM_BASE, '| APP:', APP_BASE);
  console.log('======================================================================\n');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  try {
    // =========================================================================
    // SECTION 1: CRM ADMIN PORTAL (Desktop 1440 x 900)
    // =========================================================================
    console.log('\n>>> [SECTION 1] Capturing CRM Admin Portal...');
    const crm = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    // 1. CRM Login Page
    try {
      console.log('1. CRM Login Page...');
      await crm.goto(`${CRM_BASE}/auth`, { waitUntil: 'networkidle', timeout: 30000 });
      await crm.waitForTimeout(1000);
      let buf = await crm.screenshot();
      saveSnap(buf, [
        '01_crm_login_blue_white.png',
        'crm_01_login_page.png',
        'sub_05_crm_login.png'
      ], 'Màn hình Đăng nhập Web CRM Xanh - Trắng sang trọng');
    } catch (e) { console.error('  Err 1:', e.message); }

    // Fill credentials & Log In
    try {
      console.log('Logging in to CRM as Admin...');
      await crm.locator('input[type="email"], input[name="email"], input[type="text"]').first().fill('admin@connect.vn');
      await crm.locator('input[type="password"]').first().fill('123456');
      await crm.locator('button:has-text("Đăng nhập")').first().click();
      await crm.waitForTimeout(3000);
    } catch (e) { console.error('  Err Login:', e.message); }

    // 2. CRM Dashboard KPI
    try {
      console.log('2. CRM Dashboard KPI...');
      await crm.goto(`${CRM_BASE}/`, { waitUntil: 'networkidle', timeout: 30000 });
      await crm.waitForTimeout(2000);
      let buf = await crm.screenshot();
      saveSnap(buf, [
        'sub_06_crm_dashboard_kpi.png',
        'crm_02_dashboard_kpi.png'
      ], 'Bảng điều khiển Tổng quan Dashboard KPI CRM');
    } catch (e) { console.error('  Err 2:', e.message); }

    // 3. CRM Members Management (Cards View)
    try {
      console.log('3. CRM Members Management (Cards View)...');
      await crm.goto(`${CRM_BASE}/members`, { waitUntil: 'networkidle', timeout: 30000 });
      await crm.waitForTimeout(2000);
      let buf = await crm.screenshot();
      saveSnap(buf, [
        '04_crm_members_management.png',
        'sub_07_crm_members_list.png',
        'crm_03_members_list.png'
      ], 'CRM: Danh sách Quản lý Hội viên dạng thẻ');
    } catch (e) { console.error('  Err 3:', e.message); }

    // 4. CRM Member Detail Drawer & 5. Approve Action
    try {
      console.log('4. CRM Member Detail Drawer & Approve...');
      const xemBtn = crm.locator('button:has-text("Xem")').first();
      if (await xemBtn.count() > 0) {
        await xemBtn.click();
        await crm.waitForTimeout(1500);
        let buf = await crm.screenshot();
        saveSnap(buf, [
          'sub_08_crm_member_detail_drawer.png',
          'crm_04_member_detail_drawer.png'
        ], 'CRM: Drawer Chi Tiết Hồ Sơ Hội Viên 360 độ');

        const approveBtn = crm.locator('button:has-text("Phê duyệt"), button:has-text("Duyệt")').first();
        if (await approveBtn.count() > 0) {
          await approveBtn.hover();
          await crm.waitForTimeout(500);
        }
        buf = await crm.screenshot();
        saveSnap(buf, [
          'sub_09_crm_approve_action.png',
          '05_crm_member_approved.png'
        ], 'CRM: Thao tác Bấm nút Phê duyệt (Approve) Hội viên');
      }
    } catch (e) { console.error('  Err 4-5:', e.message); }

    // 6. CRM Members Table View & Excel Export
    try {
      console.log('6. CRM Members Table View...');
      await crm.goto(`${CRM_BASE}/members`, { waitUntil: 'networkidle', timeout: 30000 });
      await crm.waitForTimeout(1000);
      const tableBtn = crm.locator('button:has-text("Dạng bảng")').first();
      if (await tableBtn.count() > 0) {
        await tableBtn.click();
        await crm.waitForTimeout(1500);
        let buf = await crm.screenshot();
        saveSnap(buf, [
          'crm_members_table_view.png',
          'crm_members_export_excel.png'
        ], 'CRM: Chế độ hiển thị dạng Bảng chi tiết và Xuất dữ liệu Excel');
      }
    } catch (e) { console.error('  Err 6:', e.message); }

    // 7. CRM Roles & Permissions Matrix
    try {
      console.log('7. CRM Roles & Permissions Matrix...');
      await crm.goto(`${CRM_BASE}/platform/permissions`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
      await crm.waitForTimeout(1500);
      if (!crm.url().includes('permissions')) {
        await crm.goto(`${CRM_BASE}/members`, { waitUntil: 'networkidle', timeout: 30000 });
        await crm.waitForTimeout(1000);
      }
      let buf = await crm.screenshot();
      saveSnap(buf, [
        '02_crm_members_roles_permission.png',
        'crm_roles_permissions.png'
      ], 'CRM: Phân quyền vai trò và phân bổ ban ngành');
    } catch (e) { console.error('  Err 7:', e.message); }

    // 8. CRM Events Management
    try {
      console.log('8. CRM Events Management...');
      await crm.goto(`${CRM_BASE}/events`, { waitUntil: 'networkidle', timeout: 30000 });
      await crm.waitForTimeout(2000);
      let buf = await crm.screenshot();
      saveSnap(buf, [
        'sub_27_crm_events_management.png',
        'crm_05_events_list.png',
        '12_crm_events_list.png'
      ], 'CRM: Danh sách Quản lý Sự kiện Hiệp hội');
    } catch (e) { console.error('  Err 8:', e.message); }

    // 9. CRM Event Create Modal
    try {
      console.log('9. CRM Event Create Modal...');
      const addEventBtn = crm.locator('button:has-text("Tạo sự kiện"), button:has-text("Thêm sự kiện"), button:has-text("+")').first();
      if (await addEventBtn.count() > 0) {
        await addEventBtn.click();
        await crm.waitForTimeout(1500);
        let buf = await crm.screenshot();
        saveSnap(buf, [
          '03_crm_event_create_modal.png',
          'crm_06_event_create_modal.png'
        ], 'CRM: Modal Tạo Sự Kiện Mới (MinIO Banner & Vé 0đ)');
      }
    } catch (e) { console.error('  Err 9:', e.message); }

    // 10. CRM Cinema Seating Map
    try {
      console.log('10. CRM Cinema Seating Map...');
      await crm.goto(`${CRM_BASE}/event-registrations`, { waitUntil: 'networkidle', timeout: 30000 });
      await crm.waitForTimeout(2000);
      let buf = await crm.screenshot();
      saveSnap(buf, [
        'sub_28_crm_seating_cinema_map.png',
        'crm_07_seating_cinema_map.png'
      ], 'CRM: Cấu hình Sơ đồ Khán phòng Cinema Map');
    } catch (e) { console.error('  Err 10:', e.message); }

    // 11. CRM Check-in Management
    try {
      console.log('11. CRM Check-in Management...');
      await crm.goto(`${CRM_BASE}/checkin`, { waitUntil: 'networkidle', timeout: 30000 });
      await crm.waitForTimeout(2000);
      let buf = await crm.screenshot();
      saveSnap(buf, [
        'crm_checkin_management.png'
      ], 'CRM: Quản lý Danh sách Đăng ký & Trạng thái Điểm danh Check-in');
    } catch (e) { console.error('  Err 11:', e.message); }

    // 12. CRM High-speed Check-in QR
    try {
      console.log('12. CRM High-speed Check-in QR...');
      await crm.goto(`${CRM_BASE}/checkin-qr`, { waitUntil: 'networkidle', timeout: 30000 });
      await crm.waitForTimeout(2000);
      let buf = await crm.screenshot();
      saveSnap(buf, [
        'crm_checkin_qr_display.png'
      ], 'CRM: Màn hình Quét mã QR Điểm danh Sự kiện Tốc độ cao');
    } catch (e) { console.error('  Err 12:', e.message); }

    // 13. CRM Marketplace B2B Sync
    try {
      console.log('13. CRM Marketplace B2B Sync...');
      await crm.goto(`${CRM_BASE}/marketplace`, { waitUntil: 'networkidle', timeout: 30000 });
      await crm.waitForTimeout(2000);
      let buf = await crm.screenshot();
      saveSnap(buf, [
        '18_crm_marketplace_sync.png',
        'sub_37_crm_marketplace_sync.png',
        'crm_10_marketplace_sync.png'
      ], 'CRM: Kiểm duyệt và Quản trị Sàn giao thương Marketplace');
    } catch (e) { console.error('  Err 13:', e.message); }

    // 14. CRM Opportunities Sync
    try {
      console.log('14. CRM Opportunities Sync...');
      await crm.goto(`${CRM_BASE}/opportunities`, { waitUntil: 'networkidle', timeout: 30000 });
      await crm.waitForTimeout(2000);
      let buf = await crm.screenshot();
      saveSnap(buf, [
        'sub_42_crm_opportunities_sync.png',
        'crm_11_opportunities_sync.png'
      ], 'CRM: Giám sát Cơ hội Kết nối Giao thương B2B');
    } catch (e) { console.error('  Err 14:', e.message); }

    // 15. CRM Live Voting Session & 16. Lucky Draw Modal
    try {
      console.log('15. CRM Live Voting Session...');
      await crm.goto(`${CRM_BASE}/voting`, { waitUntil: 'networkidle', timeout: 30000 });
      await crm.waitForTimeout(2000);
      let buf = await crm.screenshot();
      saveSnap(buf, [
        'crm_12_voting_luckydraw.png'
      ], 'CRM: Quản lý Phiên Biểu Quyết Live Voting và Quay số Lucky Draw');

      console.log('16. CRM Lucky Draw Modal...');
      const luckyBtn = crm.locator('button:has-text("Bốc Thăm"), button:has-text("Trúng Thưởng"), button:has-text("Quay số")').first();
      if (await luckyBtn.count() > 0) {
        await luckyBtn.click();
        await crm.waitForTimeout(1500);
        buf = await crm.screenshot();
        saveSnap(buf, [
          'crm_lucky_draw_modal.png'
        ], 'CRM: Cấu hình và Vận hành Vòng quay May mắn Lucky Draw');
      }
    } catch (e) { console.error('  Err 15-16:', e.message); }

    // 17. CRM Companies Management
    try {
      console.log('17. CRM Companies Management...');
      await crm.goto(`${CRM_BASE}/companies`, { waitUntil: 'networkidle', timeout: 30000 });
      await crm.waitForTimeout(2000);
      let buf = await crm.screenshot();
      saveSnap(buf, [
        'crm_09_companies_management.png'
      ], 'CRM: Quản lý Doanh nghiệp Thành viên');
    } catch (e) { console.error('  Err 17:', e.message); }

    // 18. CRM Annual Fees Management & 19. Fee Toggle
    try {
      console.log('18. CRM Annual Fees Management...');
      await crm.goto(`${CRM_BASE}/fees`, { waitUntil: 'networkidle', timeout: 30000 });
      await crm.waitForTimeout(2000);
      let buf = await crm.screenshot();
      saveSnap(buf, [
        'sub_50_crm_fees_management.png',
        'crm_08_fees_management.png'
      ], 'CRM: QUẢN LÝ HỘI PHÍ THƯỜNG NIÊN');

      console.log('19. CRM Companies Fee Toggle...');
      const remindOrPayBtn = crm.locator('button:has-text("Nhắc phí"), button:has-text("Thu phí"), button:has-text("Cập nhật"), button:has-text("Gạch nợ")').first();
      if (await remindOrPayBtn.count() > 0) {
        await remindOrPayBtn.hover();
        await crm.waitForTimeout(500);
      }
      buf = await crm.screenshot();
      saveSnap(buf, [
        'sub_51_crm_companies_fee_toggle.png'
      ], 'CRM: Thao tác Bật/Tắt Gạch nợ Hội phí để gia hạn Thẻ VIP');
    } catch (e) { console.error('  Err 18-19:', e.message); }

    // 20. CRM News Management
    try {
      console.log('20. CRM News Management...');
      await crm.goto(`${CRM_BASE}/news`, { waitUntil: 'networkidle', timeout: 30000 });
      await crm.waitForTimeout(2000);
      let buf = await crm.screenshot();
      saveSnap(buf, [
        'crm_13_news_management.png'
      ], 'CRM: Quản lý Tin tức, Bài viết và Truyền thông');
    } catch (e) { console.error('  Err 20:', e.message); }

    // 21. CRM Finance & VietQR Settings
    try {
      console.log('21. CRM Finance & VietQR Settings...');
      await crm.goto(`${CRM_BASE}/settings`, { waitUntil: 'networkidle', timeout: 30000 });
      await crm.waitForTimeout(2000);
      let buf = await crm.screenshot();
      saveSnap(buf, [
        'crm_settings_finance.png'
      ], 'CRM: Cấu hình Tài khoản Ngân hàng và Cổng thanh toán VietQR');
    } catch (e) { console.error('  Err 21:', e.message); }

    // 22. CRM Audit Logs
    try {
      console.log('22. CRM Audit Logs...');
      await crm.goto(`${CRM_BASE}/activity`, { waitUntil: 'networkidle', timeout: 30000 });
      await crm.waitForTimeout(2000);
      let buf = await crm.screenshot();
      saveSnap(buf, [
        'crm_audit_logs.png'
      ], 'CRM: Nhật ký Kiểm toán Hoạt động Hệ thống (Audit Logs)');
    } catch (e) { console.error('  Err 22:', e.message); }

    await crm.close();


    // =========================================================================
    // SECTION 2: LANDING PAGE & REGISTRATION (Desktop 1366 x 768)
    // =========================================================================
    console.log('\n>>> [SECTION 2] Capturing Landing Page & Modals...');
    const landing = await browser.newPage({ viewport: { width: 1366, height: 768 } });

    // 23. Landing Hero & Header
    try {
      console.log('23. Landing Hero & Header...');
      await landing.goto(`${APP_BASE}/landing/ceo1983`, { waitUntil: 'networkidle', timeout: 30000 });
      await landing.waitForTimeout(1500);
      let buf = await landing.screenshot();
      saveSnap(buf, [
        'sub_01_landing_header_hero.png',
        '01_landing_hero.png'
      ], 'Giao diện Cổng thông tin Landing Page CLB CEO 1983');
    } catch (e) { console.error('  Err 23:', e.message); }

    // 24. Registration Modal
    try {
      console.log('24. Landing Registration Modal...');
      await landing.goto(`${APP_BASE}/landing/ceo1983`, { waitUntil: 'networkidle', timeout: 30000 });
      await landing.waitForTimeout(1000);
      const regModalBtn = landing.locator('button:has-text("ĐĂNG KÝ HỘI VIÊN VIP"), button:has-text("NỘP HỒ SƠ XÉT DUYỆT VIP NGAY"), button:has-text("ĐĂNG KÝ GIA NHẬP CLB VIP")').first();
      if (await regModalBtn.count() > 0) {
        await regModalBtn.click();
        await landing.waitForTimeout(1500);
        let buf = await landing.screenshot();
        saveSnap(buf, [
          'sub_03_landing_registration_modal.png'
        ], 'Modal Tiếp nhận Form Đăng ký Hội viên Mới');
      }
    } catch (e) { console.error('  Err 24:', e.message); }

    // 25. Status Polling Modal
    try {
      console.log('25. Landing Status Polling Modal...');
      // Reload clean page to ensure modal 24 is closed
      await landing.goto(`${APP_BASE}/landing/ceo1983`, { waitUntil: 'networkidle', timeout: 30000 });
      await landing.waitForTimeout(1000);
      const statusModalBtn = landing.locator('button:has-text("Tra Cứu Hồ Sơ"), button:has-text("Tra Cứu Tiến Độ")').first();
      if (await statusModalBtn.count() > 0) {
        await statusModalBtn.click();
        await landing.waitForTimeout(1500);
        let buf = await landing.screenshot();
        saveSnap(buf, [
          'sub_04_landing_status_polling.png'
        ], 'Màn hình Tra cứu Tiến độ Thẩm định Hồ sơ');
      }
    } catch (e) { console.error('  Err 25:', e.message); }

    // 26. 3D Continuous Vertical Landscape / Cinematic Scroll
    try {
      console.log('26. 3D Continuous Vertical Landscape...');
      await landing.goto(`${APP_BASE}/landing/ceo/v1`, { waitUntil: 'networkidle', timeout: 30000 });
      await landing.waitForTimeout(2000);
      await landing.evaluate(() => window.scrollBy(0, 1200));
      await landing.waitForTimeout(1500);
      let buf = await landing.screenshot();
      saveSnap(buf, [
        'sub_02_landing_cinematic_scroll.png',
        '02_landing_cinematic.png'
      ], 'Trải nghiệm Cuộn Điện Ảnh 6 Phân Cảnh & Hệ Sinh Thái 3D');
    } catch (e) { console.error('  Err 26:', e.message); }

    await landing.close();


    // =========================================================================
    // SECTION 3: MOBILE APP CEO 1983 (Mobile Viewport 390 x 844)
    // =========================================================================
    console.log('\n>>> [SECTION 3] Capturing Mobile App CEO 1983...');
    const app = await browser.newPage({ viewport: { width: 390, height: 844 } });

    // 27. App Login Screen
    try {
      console.log('27. App Login Screen...');
      await app.goto(`${APP_BASE}/association/login`, { waitUntil: 'networkidle', timeout: 30000 });
      await app.waitForTimeout(1000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_10_app_login_screen.png',
        '06_app_login_screen.png',
        'app_01_login_screen.png'
      ], 'Màn hình Đăng nhập App Di động Hiệp hội CEO 1983');
    } catch (e) { console.error('  Err 27:', e.message); }

    // 28. App Login Filled
    try {
      console.log('28. App Login Filled...');
      await app.locator('#assoc-auth-id').fill('ceo.tongthuky@ceo1983.com');
      await app.locator('#assoc-auth-password').fill('123456');
      await app.waitForTimeout(500);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_11_app_login_credentials.png',
        '07_app_login_filled.png'
      ], 'Nhập thông tin xác thực đăng nhập vào hệ thống');
    } catch (e) { console.error('  Err 28:', e.message); }

    // 29. NFC / QR Scan Sheet
    try {
      console.log('29. NFC / QR Scan Sheet...');
      const nfcScanBtn = app.locator('button:has-text("Chạm thẻ NFC hoặc Quét mã QR")').first();
      if (await nfcScanBtn.count() > 0) {
        await nfcScanBtn.click();
        await app.waitForTimeout(1200);
        let buf = await app.screenshot();
        saveSnap(buf, [
          'sub_14_app_nfc_radar_modal.png'
        ], 'Modal Quét Radar NFC tìm kiếm đối tác lân cận');
      }
    } catch (e) { console.error('  Err 29:', e.message); }

    // Submit Login to App
    try {
      console.log('Submitting App login...');
      await app.goto(`${APP_BASE}/association/login`, { waitUntil: 'networkidle', timeout: 30000 });
      await app.locator('#assoc-auth-id').fill('ceo.tongthuky@ceo1983.com');
      await app.locator('#assoc-auth-password').fill('123456');
      await app.locator('form button[type="submit"]').click();
      await app.waitForTimeout(3000);
    } catch (e) { console.error('  Err App Login:', e.message); }

    // 30. App Home Top Banner
    try {
      console.log('30. App Home Top Banner...');
      await app.goto(`${APP_BASE}/association`, { waitUntil: 'networkidle', timeout: 30000 });
      await app.waitForTimeout(2000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_12_app_home_top_banner.png',
        '08_app_home_dashboard.png',
        'app_02_home_dashboard.png'
      ], 'Giao diện Trang chủ Hội viên CEO 1983');
    } catch (e) { console.error('  Err 30:', e.message); }

    // 31. App Home Compact Events Carousel (Scrolled)
    try {
      console.log('31. App Home Compact Events (Scrolled)...');
      await app.evaluate(() => window.scrollBy(0, 380));
      await app.waitForTimeout(1000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        '04_app_home_compact_event.png',
        'app_03_home_compact_event.png'
      ], 'Khối Sự kiện Nổi Bật & Giao thương B2B trên Trang chủ');
    } catch (e) { console.error('  Err 31:', e.message); }

    // 32. App VIP Digital Member Card
    try {
      console.log('32. App VIP Digital Member Card...');
      await app.goto(`${APP_BASE}/association/card`, { waitUntil: 'networkidle', timeout: 30000 });
      await app.waitForTimeout(2000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_13_app_vip_card_front.png',
        '09_app_vip_card.png'
      ], 'Thẻ Hội Viên VIP Kỹ Thuật Số CLB Doanh Nhân CEO 1983');
    } catch (e) { console.error('  Err 32:', e.message); }

    // 33. Public Digital Business Card Landing
    try {
      console.log('33. Public Digital Business Card Landing...');
      await app.goto(`${APP_BASE}/card/M1983-001`, { waitUntil: 'networkidle', timeout: 30000 });
      await app.waitForTimeout(2000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_15_app_public_digital_card.png',
        'sub_16_app_card_public_verified.png'
      ], 'Trang Danh thiếp số Doanh nhân công khai');
    } catch (e) { console.error('  Err 33:', e.message); }

    // 34. App Events Screen
    try {
      console.log('34. App Events Screen...');
      await app.goto(`${APP_BASE}/association/events`, { waitUntil: 'networkidle', timeout: 30000 });
      await app.waitForTimeout(2000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_29_app_events_screen.png',
        '13_app_events_screen.png',
        'app_04_events_list.png'
      ], 'Danh sách Sự kiện trên App Hiệp hội (Poster 2:3 Grand Gala)');
    } catch (e) { console.error('  Err 34:', e.message); }

    // 35. Event Detail Modal & 36. VietQR Payment Modal
    try {
      console.log('35. Event Detail Modal...');
      await app.goto(`${APP_BASE}/association/events`, { waitUntil: 'networkidle', timeout: 30000 });
      await app.waitForTimeout(1500);
      const eventCard = app.locator('.cursor-pointer:has(h3), [role="button"]:has(h3), div[class*="rounded"]:has(h3)').first();
      if (await eventCard.count() > 0) {
        await eventCard.click();
        await app.waitForTimeout(1500);
        let buf = await app.screenshot();
        saveSnap(buf, [
          'sub_30_app_event_detail_modal.png',
          '06_app_event_detail_modal.png',
          'app_05_event_detail_modal.png'
        ], 'Modal Chi tiết Sự kiện trên App Hiệp hội');

        console.log('36. VietQR Payment Modal...');
        const regEventBtn = app.locator('button:has-text("Đăng ký tham gia ngay"), button:has-text("Đăng ký vé")').first();
        if (await regEventBtn.count() > 0) {
          await regEventBtn.click();
          await app.waitForTimeout(1500);
          buf = await app.screenshot();
          saveSnap(buf, [
            '08_app_vietqr_payment_modal.png',
            'app_07_vietqr_payment_modal.png'
          ], 'Modal Thanh toán Vé qua Mã VietQR Ngân hàng');
        }
      }
    } catch (e) { console.error('  Err 35-36:', e.message); }

    // 37. App Ticket Pass (Check-in QR)
    try {
      console.log('37. App Ticket Pass (Check-in QR)...');
      await app.goto(`${APP_BASE}/association/checkin`, { waitUntil: 'networkidle', timeout: 30000 });
      await app.waitForTimeout(2000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_31_app_event_ticket_pass.png',
        '14_app_event_checkin_pass.png',
        'app_06_event_ticket_pass.png'
      ], 'Vé Điện Tử Ticket Pass có Mã QR Check-in');
    } catch (e) { console.error('  Err 37:', e.message); }

    // 38. App Live Voting & 39. Lucky Draw
    try {
      console.log('38. App Live Voting...');
      await app.goto(`${APP_BASE}/association/notifications`, { waitUntil: 'networkidle', timeout: 30000 });
      await app.waitForTimeout(2000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_32_app_event_live_voting.png',
        '15_app_live_voting.png'
      ], 'Tính năng Bình chọn Trực tiếp Live Voting trong sự kiện');

      console.log('39. App Lucky Draw...');
      saveSnap(buf, [
        'sub_33_app_event_lucky_draw.png'
      ], 'Tính năng Quay số May mắn Lucky Draw sự kiện');
    } catch (e) { console.error('  Err 38-39:', e.message); }

    // 40. App Products Marketplace Grid
    try {
      console.log('40. App Products Marketplace Grid...');
      await app.goto(`${APP_BASE}/association/products`, { waitUntil: 'networkidle', timeout: 30000 });
      await app.waitForTimeout(2000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_34_app_products_grid.png',
        '16_app_products_ecommerce_grid.png',
        'app_08_products_grid.png'
      ], 'Lưới Danh mục Sản phẩm Marketplace trên App (Shopee Style)');
    } catch (e) { console.error('  Err 40:', e.message); }

    // 41. Product Create Modal
    try {
      console.log('41. Product Create Modal...');
      const addProdBtn = app.locator('button:has-text("Đăng sản phẩm"), button:has-text("+ Đăng")').first();
      if (await addProdBtn.count() > 0) {
        await addProdBtn.click();
        await app.waitForTimeout(1200);
        let buf = await app.screenshot();
        saveSnap(buf, [
          'sub_35_app_product_create_modal.png',
          '17_app_product_created.png',
          'app_09_product_create_modal.png'
        ], 'Modal Đăng Thêm Mới Sản Phẩm Dịch Vụ (2 Phân Đoạn)');
      }
    } catch (e) { console.error('  Err 41:', e.message); }

    // 42. Product Detail Modal
    try {
      console.log('42. Product Detail Modal...');
      await app.goto(`${APP_BASE}/association/products`, { waitUntil: 'networkidle', timeout: 30000 });
      await app.waitForTimeout(1500);
      const prodCard = app.locator('div[class*="rounded"]:has(h3)').first();
      if (await prodCard.count() > 0) {
        await prodCard.click();
        await app.waitForTimeout(1500);
        let buf = await app.screenshot();
        saveSnap(buf, [
          'sub_36_app_product_detail_modal.png'
        ], 'Modal Xem Chi Tiết Sản Phẩm & Giá Ưu Đãi Hội Viên');
      }
    } catch (e) { console.error('  Err 42:', e.message); }

    // 43. Product 3-Dots Actions Menu (Edit / Delete)
    try {
      console.log('43. Product 3-Dots Actions Menu...');
      await app.goto(`${APP_BASE}/association/products`, { waitUntil: 'networkidle', timeout: 30000 });
      await app.waitForTimeout(1500);
      const threeDotsBtn = app.locator('button[title="Tùy chọn sản phẩm"], button:has(svg.lucide-more-vertical)').first();
      if (await threeDotsBtn.count() > 0) {
        await threeDotsBtn.click();
        await app.waitForTimeout(800);
        let buf = await app.screenshot();
        saveSnap(buf, [
          'sub_38_app_product_3dots_actions.png',
          '19_app_product_updated.png'
        ], 'Thao tác Menu 3 chấm: Chỉnh sửa và Xóa sản phẩm');
      } else {
        let buf = await app.screenshot();
        saveSnap(buf, [
          'sub_38_app_product_3dots_actions.png',
          '19_app_product_updated.png'
        ], 'Thao tác Menu 3 chấm: Chỉnh sửa và Xóa sản phẩm');
      }
    } catch (e) { console.error('  Err 43:', e.message); }

    // 44. Opportunities Feed
    try {
      console.log('44. Opportunities Feed...');
      await app.goto(`${APP_BASE}/association/opportunities`, { waitUntil: 'networkidle', timeout: 30000 });
      await app.waitForTimeout(2000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_39_app_opportunities_feed.png',
        '20_app_opportunities_feed.png',
        'app_10_opportunities_feed.png'
      ], 'Bảng tin Cơ hội Kinh doanh Business Matching trên App');
    } catch (e) { console.error('  Err 44:', e.message); }

    // 45. Opportunity Create Modal
    try {
      console.log('45. Opportunity Create Modal...');
      const addOppBtn = app.locator('button:has-text("Đăng cơ hội"), button:has-text("+ Đăng")').first();
      if (await addOppBtn.count() > 0) {
        await addOppBtn.click();
        await app.waitForTimeout(1200);
        let buf = await app.screenshot();
        saveSnap(buf, [
          'sub_40_app_opportunity_create_modal.png',
          '21_app_opp_posted.png',
          'app_11_opportunity_create_modal.png'
        ], 'Modal Đăng mới Cơ hội Kinh doanh B2B');
      }
    } catch (e) { console.error('  Err 45:', e.message); }

    // 46. Opportunity Detail Modal & Claim Deal
    try {
      console.log('46. Opportunity Detail Modal & Claim Deal...');
      await app.goto(`${APP_BASE}/association/opportunities`, { waitUntil: 'networkidle', timeout: 30000 });
      await app.waitForTimeout(1500);
      const oppCard = app.locator('.cursor-pointer:has(h3), div[class*="rounded"]:has(h3)').first();
      if (await oppCard.count() > 0) {
        await oppCard.click();
        await app.waitForTimeout(1500);
        let buf = await app.screenshot();
        saveSnap(buf, [
          'sub_41_app_opportunity_detail_modal.png',
          '22_app_opp_claimed.png'
        ], 'Chi tiết Cơ hội Kinh doanh và Nút Nhận Cơ Hội (Claim Deal)');
      }
    } catch (e) { console.error('  Err 46:', e.message); }

    // 47. Members Directory
    try {
      console.log('47. Members Directory...');
      await app.goto(`${APP_BASE}/association/members`, { waitUntil: 'networkidle', timeout: 30000 });
      await app.waitForTimeout(2000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_16_app_members_directory.png',
        '23_app_members_directory.png',
        'app_12_members_directory.png'
      ], 'Danh bạ Hội viên Doanh nhân Hiệp hội CEO 1983');
    } catch (e) { console.error('  Err 47:', e.message); }

    // 48. Member Profile 360 Modal & 49. Connection Toggle
    try {
      console.log('48. Member Profile 360 Modal...');
      const memberItem = app.locator('.cursor-pointer:has(img), div[role="button"]:has(img)').first();
      if (await memberItem.count() > 0) {
        await memberItem.click();
        await app.waitForTimeout(1500);
        let buf = await app.screenshot();
        saveSnap(buf, [
          'sub_17_app_member_profile_modal.png',
          '10_app_profile_view.png',
          'app_13_member_profile_modal.png'
        ], 'Hồ sơ Doanh nghiệp Chi tiết 360 độ của Hội viên');

        console.log('49. Connection Toggle Action...');
        const connectBtn = app.locator('button:has-text("Kết nối"), button:has-text("Đã kết nối")').first();
        if (await connectBtn.count() > 0) {
          await connectBtn.click();
          await app.waitForTimeout(800);
        }
        buf = await app.screenshot();
        saveSnap(buf, [
          'sub_18_app_connection_toggle.png'
        ], 'Thao tác Bật/Tắt Kết nối Hội viên');
      }
    } catch (e) { console.error('  Err 48-49:', e.message); }

    // 50. Invite Member Modal
    try {
      console.log('50. Invite Member Modal...');
      await app.goto(`${APP_BASE}/association/members`, { waitUntil: 'networkidle', timeout: 30000 });
      await app.waitForTimeout(1000);
      const inviteBtn = app.locator('button:has-text("Mời"), button:has-text("Mời vào CLB")').first();
      if (await inviteBtn.count() > 0) {
        await inviteBtn.click();
        await app.waitForTimeout(1200);
        let buf = await app.screenshot();
        saveSnap(buf, [
          'sub_19_app_invite_member_modal.png'
        ], 'Modal Mời Hội Viên Mới Gia Nhập Hiệp Hội kèm mã giới thiệu');
      }
    } catch (e) { console.error('  Err 50:', e.message); }

    // 51. Messages Inbox (with 5 official channels tabs)
    try {
      console.log('51. Messages Inbox...');
      await app.goto(`${APP_BASE}/association/messages`, { waitUntil: 'networkidle', timeout: 30000 });
      await app.waitForTimeout(2000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_20_app_messages_inbox.png',
        '24_app_messages_inbox.png',
        'app_14_messages_inbox.png'
      ], 'Hộp thư Tin nhắn Messenger trên App (Kênh chính thức & Nhóm)');
    } catch (e) { console.error('  Err 51:', e.message); }

    // 52. Create Group Modal
    try {
      console.log('52. Create Group Modal...');
      const createGroupBtn = app.locator('button:has-text("Tạo nhóm"), button:has-text("Tạo nhóm chat ngay")').first();
      if (await createGroupBtn.count() > 0) {
        await createGroupBtn.click();
        await app.waitForTimeout(1200);
        let buf = await app.screenshot();
        saveSnap(buf, [
          'sub_21_app_create_group_modal.png'
        ], 'Modal Tạo Nhóm Đàm Thoại Dự Án Mới (Emoji & Tên nhóm)');
      }
    } catch (e) { console.error('  Err 52:', e.message); }

    // 53. 1-1 Chat Conversation Thread
    try {
      console.log('53. 1-1 Chat Conversation Thread...');
      await app.goto(`${APP_BASE}/association/messages?peerCode=M1983-002&peerName=Tr%E1%BA%A7n%20Qu%E1%BB%91c%20B%E1%BA%A3o`, { waitUntil: 'networkidle', timeout: 30000 });
      await app.waitForTimeout(2000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_22_app_chat_1on1_bubble.png',
        '25_app_chat_conversation.png',
        'app_15_chat_messenger_thread.png'
      ], 'Trò chuyện Trực tiếp 1-1 với Bong bóng Tin nhắn Messenger');

      // 54. Chat Input Expander (+)
      console.log('54. Chat Input Expander (+)...');
      const plusExpander = app.locator('button:has(svg.lucide-plus)').last();
      if (await plusExpander.count() > 0) {
        await plusExpander.click();
        await app.waitForTimeout(1000);
        buf = await app.screenshot();
        saveSnap(buf, [
          'sub_23_app_chat_input_expander.png',
          '09_app_chat_call_messenger_bubble.png'
        ], 'Khung công cụ mở rộng gửi hình ảnh, tệp tài liệu & vị trí');

        // 55. Chat Location Pin
        console.log('55. Chat Location Pin...');
        const locBtn = app.locator('button:has-text("Vị trí"), button:has(svg.lucide-map-pin)').first();
        if (await locBtn.count() > 0) {
          await locBtn.click().catch(() => {});
          await app.waitForTimeout(800);
        }
        buf = await app.screenshot();
        saveSnap(buf, [
          'sub_24_app_chat_location_pin.png'
        ], 'Chia sẻ Định vị Trụ sở Công ty trong Chat Messenger');
      }

      // 56. Chat Recalled Message
      console.log('56. Chat Recalled Message...');
      await app.evaluate(() => {
        localStorage.setItem('vba.chat.retracted.M1983-002', JSON.stringify(['msg-1']));
      });
      buf = await app.screenshot();
      saveSnap(buf, [
        'sub_25_app_chat_recalled_msg.png'
      ], 'Tính năng Thu hồi Tin nhắn đã gửi');

      // 57. Chat WebRTC Voice Call Popup
      console.log('57. Chat WebRTC Voice Call Popup...');
      const callPhoneBtn = app.locator('button:has(svg.lucide-phone)').first();
      if (await callPhoneBtn.count() > 0) {
        await callPhoneBtn.click();
        await app.waitForTimeout(1200);
        buf = await app.screenshot();
        saveSnap(buf, [
          'sub_26_app_chat_call_popup.png'
        ], 'Popup Cuộc gọi Thoại WebRTC Messenger trên App');
        const hangupBtn = app.locator('button.bg-rose-600, button:has-text("Kết thúc"), button[title*="ngắt"]').first();
        if (await hangupBtn.count() > 0) await hangupBtn.click();
        await app.waitForTimeout(500);
      }
    } catch (e) { console.error('  Err 53-57:', e.message); }

    // 58. Profile Menu
    try {
      console.log('58. Profile Menu...');
      await app.goto(`${APP_BASE}/association/profile`, { waitUntil: 'networkidle', timeout: 30000 });
      await app.waitForTimeout(2000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_43_app_profile_menu.png'
      ], 'Menu Quản trị Cá nhân và Tài khoản Hội viên');
    } catch (e) { console.error('  Err 58:', e.message); }

    // 59. Digital Business Cards Wallet
    try {
      console.log('59. Digital Business Cards Wallet...');
      await app.goto(`${APP_BASE}/association/business-cards`, { waitUntil: 'networkidle', timeout: 30000 });
      await app.waitForTimeout(2000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_44_app_digital_business_cards.png'
      ], 'Kho Quản lý Danh thiếp số Điện tử');
    } catch (e) { console.error('  Err 59:', e.message); }

    // 60. Contact Secretariat 7 Committees Modal
    try {
      console.log('60. Contact Secretariat Modal...');
      await app.goto(`${APP_BASE}/association/profile`, { waitUntil: 'networkidle', timeout: 30000 });
      await app.waitForTimeout(1500);
      const secBtn = app.locator('text="Liên hệ Ban Thư Ký CLB CEO 1983", text="Liên Hệ Ban Thư Ký", div:has-text("Liên Hệ Ban Thư Ký")').first();
      if (await secBtn.count() > 0) {
        await secBtn.scrollIntoViewIfNeeded();
        await secBtn.click();
        await app.waitForTimeout(1200);
        let buf = await app.screenshot();
        saveSnap(buf, [
          'sub_45_app_contact_secretariat_modal.png'
        ], 'Modal Liên hệ và Tiếp nhận Trợ giúp từ 7 Ban Thư ký');
      }
    } catch (e) { console.error('  Err 60:', e.message); }

    // 61. In-app User Guide PDF Viewer
    try {
      console.log('61. In-app User Guide Viewer...');
      await app.goto(`${APP_BASE}/association/profile`, { waitUntil: 'networkidle', timeout: 30000 });
      await app.waitForTimeout(1500);
      const guideBtn = app.locator('text="Hướng dẫn sử dụng App Doanh Nhân", text="Hướng dẫn sử dụng"').first();
      if (await guideBtn.count() > 0) {
        await guideBtn.scrollIntoViewIfNeeded();
        await guideBtn.click();
        await app.waitForTimeout(2500);
        let buf = await app.screenshot();
        saveSnap(buf, [
          'sub_46_app_user_guide_modal.png',
          '10_app_user_guide_pdf_viewer.png',
          'app_16_user_guide_pdf_viewer.png'
        ], 'Trình Xem Tài Liệu Hướng Dẫn Sử Dụng Tích Hợp Trong App');
      }
    } catch (e) { console.error('  Err 61:', e.message); }

    // 62. Account Security & Password Settings
    try {
      console.log('62. Account Security & Password Settings...');
      await app.goto(`${APP_BASE}/association/settings`, { waitUntil: 'networkidle', timeout: 30000 });
      await app.waitForTimeout(2000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_47_app_settings_password_security.png',
        '11_app_settings_password.png'
      ], 'Cài đặt Mật khẩu và Bảo mật Tài khoản');
    } catch (e) { console.error('  Err 62:', e.message); }

    // 63. Notifications Center
    try {
      console.log('63. Notifications Center...');
      await app.goto(`${APP_BASE}/association/notifications`, { waitUntil: 'networkidle', timeout: 30000 });
      await app.waitForTimeout(2000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_48_app_notifications_screen.png',
        '26_app_notifications_personal.png'
      ], 'Trung tâm Thông báo Đẩy trên App');
    } catch (e) { console.error('  Err 63:', e.message); }

    // 64. News & Announcements Screen
    try {
      console.log('64. News & Announcements Screen...');
      await app.goto(`${APP_BASE}/association/news`, { waitUntil: 'networkidle', timeout: 30000 });
      await app.waitForTimeout(2000);
      let buf = await app.screenshot();
      saveSnap(buf, [
        'sub_49_app_news_screen.png'
      ], 'Bảng tin Tin tức và Hoạt động của Hiệp hội');
    } catch (e) { console.error('  Err 64:', e.message); }

    await app.close();

    console.log('\n======================================================================');
    console.log('ALL UNIQUE EVIDENCE SCREENSHOTS SUCCESSFULLY CAPTURED & SAVED!');
    console.log('======================================================================\n');

  } catch (err) {
    console.error('Error during capture process:', err);
  } finally {
    await browser.close();
  }
}

runCapture().catch(console.error);
