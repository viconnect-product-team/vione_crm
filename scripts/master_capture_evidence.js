const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CRM_BASE = 'http://14.225.217.232:5000';
const APP_BASE = 'http://14.225.217.232:5002';
const EVIDENCE_DIR = path.join(__dirname, '..', 'document', 'images', 'evidence');
const PUBLIC_EVIDENCE_DIR = path.join(__dirname, '..', 'apps', 'vione_app_fe', 'public', 'docs', 'images', 'evidence');

for (const dir of [EVIDENCE_DIR, PUBLIC_EVIDENCE_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function saveFiles(buffer, filenames) {
  for (const fn of filenames) {
    const target1 = path.join(EVIDENCE_DIR, fn);
    const target2 = path.join(PUBLIC_EVIDENCE_DIR, fn);
    fs.writeFileSync(target1, buffer);
    fs.writeFileSync(target2, buffer);
    console.log(`  [SAVED] ${fn} (${buffer.length} bytes)`);
  }
}

async function captureAllEvidence() {
  console.log('===============================================================');
  console.log('STARTING MASTER HIGH-FIDELITY EVIDENCE SCREENSHOT CAPTURE');
  console.log('CRM:', CRM_BASE, '| APP:', APP_BASE);
  console.log('Target Directories:', EVIDENCE_DIR, 'and', PUBLIC_EVIDENCE_DIR);
  console.log('===============================================================\n');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  try {
    // =========================================================================
    // PART 1: CRM DESKTOP PORTAL (1440 x 900)
    // =========================================================================
    console.log('>>> [PART 1] CRM Admin Portal Screenshots...');
    const crmPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    // 1.1 CRM Login
    try {
      console.log('1.1 Capturing CRM Login...');
      await crmPage.goto(`${CRM_BASE}/auth`, { waitUntil: 'networkidle', timeout: 30000 });
      await crmPage.waitForTimeout(1000);
      const buf = await crmPage.screenshot();
      saveFiles(buf, [
        '01_crm_login_blue_white.png',
        '03_crm_login_page.png',
        'sub_05_crm_login.png',
        'crm_01_login_page.png'
      ]);
    } catch (e) { console.error('  Err 1.1:', e.message); }

    // Perform Login
    try {
      console.log('Logging in as Admin...');
      await crmPage.locator('input[type="email"], input[name="email"], input[placeholder*="email"], input[type="text"]').first().fill('admin@connect.vn');
      await crmPage.locator('input[type="password"]').first().fill('123456');
      await crmPage.locator('button:has-text("Đăng nhập")').first().click();
      await crmPage.waitForTimeout(3000);
    } catch (e) { console.error('  Err Login:', e.message); }

    // 1.2 CRM Dashboard KPI
    try {
      console.log('1.2 Capturing CRM Dashboard KPI...');
      await crmPage.goto(`${CRM_BASE}/`, { waitUntil: 'networkidle', timeout: 30000 });
      await crmPage.waitForTimeout(2000);
      const buf = await crmPage.screenshot();
      saveFiles(buf, [
        'sub_06_crm_dashboard_kpi.png',
        'crm_02_dashboard_kpi.png'
      ]);
    } catch (e) { console.error('  Err 1.2:', e.message); }

    // 1.3 CRM Members Management (Cards View)
    try {
      console.log('1.3 Capturing CRM Members Management (Cards View)...');
      await crmPage.goto(`${CRM_BASE}/members`, { waitUntil: 'networkidle', timeout: 30000 });
      await crmPage.waitForTimeout(2000);
      const buf = await crmPage.screenshot();
      saveFiles(buf, [
        '04_crm_members_management.png',
        'sub_07_crm_members_list.png',
        'crm_03_members_list.png'
      ]);
    } catch (e) { console.error('  Err 1.3:', e.message); }

    // 1.4 CRM Members Table View
    try {
      console.log('1.4 Capturing CRM Members Table View...');
      await crmPage.goto(`${CRM_BASE}/members`, { waitUntil: 'networkidle', timeout: 30000 });
      await crmPage.waitForTimeout(1000);
      const tableBtn = crmPage.locator('button:has-text("Dạng bảng")').first();
      if (await tableBtn.count() > 0) {
        await tableBtn.click();
        await crmPage.waitForTimeout(1500);
        const buf = await crmPage.screenshot();
        saveFiles(buf, [
          'crm_members_table_view.png',
          'crm_members_export_excel.png'
        ]);
      }
    } catch (e) { console.error('  Err 1.4:', e.message); }

    // 1.5 CRM Member Role / Account Modal
    try {
      console.log('1.5 Capturing CRM Member Roles & Permissions Modal...');
      const userCogBtn = crmPage.locator('tbody tr button[title*="tài khoản"], tbody tr button[aria-label*="tài khoản"], tbody tr button:nth-of-type(2)').first();
      if (await userCogBtn.count() > 0) {
        await userCogBtn.click();
        await crmPage.waitForTimeout(1500);
        const buf = await crmPage.screenshot();
        saveFiles(buf, [
          '02_crm_members_roles_permission.png',
          'crm_roles_permissions.png'
        ]);
      }
    } catch (e) { console.error('  Err 1.5:', e.message); }

    // 1.6 CRM Member 360 Detail Profile
    try {
      console.log('1.6 Capturing CRM Member 360 Detail Profile...');
      await crmPage.goto(`${CRM_BASE}/members/c1983000-0000-4000-8000-000000000005`, { waitUntil: 'networkidle', timeout: 30000 });
      await crmPage.waitForTimeout(2000);
      const buf = await crmPage.screenshot();
      saveFiles(buf, [
        'sub_08_crm_member_detail_drawer.png',
        'crm_04_member_detail_drawer.png',
        '05_crm_member_approved.png'
      ]);
    } catch (e) { console.error('  Err 1.6:', e.message); }

    // 1.7 CRM Member Approve Action
    try {
      console.log('1.7 Capturing CRM Member Approve Action...');
      await crmPage.goto(`${CRM_BASE}/members`, { waitUntil: 'networkidle', timeout: 30000 });
      await crmPage.waitForTimeout(1500);
      const approveBtn = crmPage.locator('button:has-text("Phê duyệt"), button:has-text("Duyệt"), button:has-text("+ Thêm hội viên")').first();
      if (await approveBtn.count() > 0) {
        await approveBtn.hover();
        await crmPage.waitForTimeout(500);
      }
      const buf = await crmPage.screenshot();
      saveFiles(buf, [
        'sub_09_crm_approve_action.png'
      ]);
    } catch (e) { console.error('  Err 1.7:', e.message); }

    // 1.8 CRM Events List
    try {
      console.log('1.8 Capturing CRM Events List...');
      await crmPage.goto(`${CRM_BASE}/events`, { waitUntil: 'networkidle', timeout: 30000 });
      await crmPage.waitForTimeout(2000);
      const buf = await crmPage.screenshot();
      saveFiles(buf, [
        '12_crm_events_list.png',
        'sub_27_crm_events_management.png',
        'crm_05_events_list.png'
      ]);
    } catch (e) { console.error('  Err 1.8:', e.message); }

    // 1.9 CRM Event Create Modal (3-Step Setup)
    try {
      console.log('1.9 Capturing CRM Event Create Modal...');
      const createEventBtn = crmPage.locator('button:has-text("Tạo sự kiện"), button:has-text("+ Tạo sự kiện")').first();
      if (await createEventBtn.count() > 0) {
        await createEventBtn.click();
        await crmPage.waitForTimeout(1500);
        const buf = await crmPage.screenshot();
        saveFiles(buf, [
          '03_crm_event_create_modal.png',
          'crm_06_event_create_modal.png'
        ]);
      }
    } catch (e) { console.error('  Err 1.9:', e.message); }

    // 1.10 CRM Event Registrations & Cinema Seating Map
    try {
      console.log('1.10 Capturing CRM Event Registrations & Seating Map...');
      await crmPage.goto(`${CRM_BASE}/event-registrations`, { waitUntil: 'networkidle', timeout: 30000 });
      await crmPage.waitForTimeout(2000);
      const buf = await crmPage.screenshot();
      saveFiles(buf, [
        'sub_28_crm_seating_cinema_map.png',
        'crm_07_seating_cinema_map.png'
      ]);
    } catch (e) { console.error('  Err 1.10:', e.message); }

    // 1.11 CRM Check-in QR/NFC Management
    try {
      console.log('1.11 Capturing CRM Check-in QR/NFC Management...');
      await crmPage.goto(`${CRM_BASE}/checkin`, { waitUntil: 'networkidle', timeout: 30000 });
      await crmPage.waitForTimeout(2000);
      const buf = await crmPage.screenshot();
      saveFiles(buf, [
        'crm_checkin_management.png'
      ]);
    } catch (e) { console.error('  Err 1.11:', e.message); }

    // 1.12 CRM Check-in Fast QR Display
    try {
      console.log('1.12 Capturing CRM High-speed Check-in QR...');
      await crmPage.goto(`${CRM_BASE}/checkin-qr`, { waitUntil: 'networkidle', timeout: 30000 });
      await crmPage.waitForTimeout(2000);
      const buf = await crmPage.screenshot();
      saveFiles(buf, [
        'crm_checkin_qr_display.png'
      ]);
    } catch (e) { console.error('  Err 1.12:', e.message); }

    // 1.13 CRM Marketplace B2B
    try {
      console.log('1.13 Capturing CRM Marketplace Sync...');
      await crmPage.goto(`${CRM_BASE}/marketplace`, { waitUntil: 'networkidle', timeout: 30000 });
      await crmPage.waitForTimeout(2000);
      const buf = await crmPage.screenshot();
      saveFiles(buf, [
        '18_crm_marketplace_sync.png',
        'sub_37_crm_marketplace_sync.png',
        'crm_10_marketplace_sync.png'
      ]);
    } catch (e) { console.error('  Err 1.13:', e.message); }

    // 1.14 CRM Opportunities Sync
    try {
      console.log('1.14 Capturing CRM Opportunities Sync...');
      await crmPage.goto(`${CRM_BASE}/opportunities`, { waitUntil: 'networkidle', timeout: 30000 });
      await crmPage.waitForTimeout(2000);
      const buf = await crmPage.screenshot();
      saveFiles(buf, [
        'sub_42_crm_opportunities_sync.png',
        'crm_11_opportunities_sync.png'
      ]);
    } catch (e) { console.error('  Err 1.14:', e.message); }

    // 1.15 CRM Live Voting
    try {
      console.log('1.15 Capturing CRM Voting...');
      await crmPage.goto(`${CRM_BASE}/voting`, { waitUntil: 'networkidle', timeout: 30000 });
      await crmPage.waitForTimeout(2000);
      const buf = await crmPage.screenshot();
      saveFiles(buf, [
        'crm_12_voting_luckydraw.png'
      ]);
    } catch (e) { console.error('  Err 1.15:', e.message); }

    // 1.16 CRM Lucky Draw Modal
    try {
      console.log('1.16 Capturing CRM Lucky Draw Modal...');
      await crmPage.goto(`${CRM_BASE}/voting`, { waitUntil: 'networkidle', timeout: 30000 });
      await crmPage.waitForTimeout(1000);
      const luckyBtn = crmPage.locator('button:has-text("Bốc Thăm"), button:has-text("Trúng Thưởng")').first();
      if (await luckyBtn.count() > 0) {
        await luckyBtn.click();
        await crmPage.waitForTimeout(1500);
        const buf = await crmPage.screenshot();
        saveFiles(buf, [
          'crm_lucky_draw_modal.png'
        ]);
      }
    } catch (e) { console.error('  Err 1.16:', e.message); }

    // 1.17 CRM Companies
    try {
      console.log('1.17 Capturing CRM Companies Management...');
      await crmPage.goto(`${CRM_BASE}/companies`, { waitUntil: 'networkidle', timeout: 30000 });
      await crmPage.waitForTimeout(2000);
      const buf = await crmPage.screenshot();
      saveFiles(buf, [
        'crm_09_companies_management.png'
      ]);
    } catch (e) { console.error('  Err 1.17:', e.message); }

    // 1.18 CRM Fees Management & Fee Toggle
    try {
      console.log('1.18 Capturing CRM Fees Management...');
      await crmPage.goto(`${CRM_BASE}/fees`, { waitUntil: 'networkidle', timeout: 30000 });
      await crmPage.waitForTimeout(2000);
      const buf = await crmPage.screenshot();
      saveFiles(buf, [
        'sub_50_crm_fees_management.png',
        'crm_08_fees_management.png',
        'sub_51_crm_companies_fee_toggle.png'
      ]);
    } catch (e) { console.error('  Err 1.18:', e.message); }

    // 1.19 CRM News Management
    try {
      console.log('1.19 Capturing CRM News Management...');
      await crmPage.goto(`${CRM_BASE}/news`, { waitUntil: 'networkidle', timeout: 30000 });
      await crmPage.waitForTimeout(2000);
      const buf = await crmPage.screenshot();
      saveFiles(buf, [
        'crm_13_news_management.png'
      ]);
    } catch (e) { console.error('  Err 1.19:', e.message); }

    // 1.20 CRM System Settings & VietQR
    try {
      console.log('1.20 Capturing CRM Settings & VietQR Account...');
      await crmPage.goto(`${CRM_BASE}/settings`, { waitUntil: 'networkidle', timeout: 30000 });
      await crmPage.waitForTimeout(2000);
      const buf = await crmPage.screenshot();
      saveFiles(buf, [
        'crm_settings_finance.png'
      ]);
    } catch (e) { console.error('  Err 1.20:', e.message); }

    // 1.21 CRM Activity / Audit Logs
    try {
      console.log('1.21 Capturing CRM Activity / Audit Logs...');
      await crmPage.goto(`${CRM_BASE}/activity`, { waitUntil: 'networkidle', timeout: 30000 });
      await crmPage.waitForTimeout(2000);
      const buf = await crmPage.screenshot();
      saveFiles(buf, [
        'crm_audit_logs.png'
      ]);
    } catch (e) { console.error('  Err 1.21:', e.message); }

    // =========================================================================
    // PART 2: LANDING PAGE (1440 x 900)
    // =========================================================================
    console.log('\n>>> [PART 2] Landing Page Screenshots...');
    const landingPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    // 2.1 Landing Hero
    try {
      console.log('2.1 Capturing Landing Hero...');
      await landingPage.goto(`${APP_BASE}/landing/ceo1983`, { waitUntil: 'networkidle', timeout: 30000 });
      await landingPage.waitForTimeout(1500);
      const buf = await landingPage.screenshot();
      saveFiles(buf, [
        '01_landing_hero.png',
        'sub_01_landing_header_hero.png'
      ]);
    } catch (e) { console.error('  Err 2.1:', e.message); }

    // 2.2 Landing Cinematic Scroll
    try {
      console.log('2.2 Capturing Landing Cinematic Scroll...');
      await landingPage.goto(`${APP_BASE}/landing/ceo1983/cinematic`, { waitUntil: 'networkidle', timeout: 30000 });
      await landingPage.waitForTimeout(1500);
      const buf = await landingPage.screenshot();
      saveFiles(buf, [
        '02_landing_cinematic.png',
        'sub_02_landing_cinematic_scroll.png'
      ]);
    } catch (e) { console.error('  Err 2.2:', e.message); }

    // 2.3 Landing Registration Modal
    try {
      console.log('2.3 Capturing Landing Registration Modal...');
      await landingPage.goto(`${APP_BASE}/landing/ceo1983`, { waitUntil: 'networkidle', timeout: 30000 });
      await landingPage.waitForTimeout(1000);
      const joinBtn = landingPage.locator('button:has-text("ĐĂNG KÝ GIA NHẬP"), a:has-text("ĐĂNG KÝ GIA NHẬP"), button:has-text("GIA NHẬP VIP")').first();
      if (await joinBtn.count() > 0) {
        await joinBtn.click();
        await landingPage.waitForTimeout(1200);
        const buf = await landingPage.screenshot();
        saveFiles(buf, [
          'sub_03_landing_registration_modal.png'
        ]);
      }
    } catch (e) { console.error('  Err 2.3:', e.message); }

    // 2.4 Landing Status Polling Modal
    try {
      console.log('2.4 Capturing Landing Status Polling Modal...');
      await landingPage.goto(`${APP_BASE}/landing/ceo1983`, { waitUntil: 'networkidle', timeout: 30000 });
      await landingPage.waitForTimeout(1000);
      const statusBtn = landingPage.locator('button:has-text("Tra Cứu"), button:has-text("Tra cứu")').first();
      if (await statusBtn.count() > 0) {
        await statusBtn.click();
        await landingPage.waitForTimeout(1200);
        const buf = await landingPage.screenshot();
        saveFiles(buf, [
          'sub_04_landing_status_polling.png'
        ]);
      }
    } catch (e) { console.error('  Err 2.4:', e.message); }

    // =========================================================================
    // PART 3: MOBILE APP HIỆP HỘI (390 x 844)
    // =========================================================================
    console.log('\n>>> [PART 3] Mobile App Screenshots (390x844)...');
    const appPage = await browser.newPage({ viewport: { width: 390, height: 844 } });

    // 3.1 App Login Screen
    try {
      console.log('3.1 Capturing App Login...');
      await appPage.goto(`${APP_BASE}/association/login`, { waitUntil: 'networkidle', timeout: 30000 });
      await appPage.waitForTimeout(1000);
      let buf = await appPage.screenshot();
      saveFiles(buf, [
        '06_app_login_screen.png',
        'sub_10_app_login_screen.png',
        'app_01_login_screen.png'
      ]);

      // 3.2 App Login Credentials Filled
      console.log('3.2 Capturing App Login with credentials...');
      await appPage.locator('#assoc-auth-id').fill('ceo.tongthuky@ceo1983.com');
      await appPage.locator('#assoc-auth-password').fill('123456');
      buf = await appPage.screenshot();
      saveFiles(buf, [
        '07_app_login_filled.png',
        'sub_11_app_login_credentials.png'
      ]);

      // Perform App Login
      console.log('Logging into App...');
      await appPage.locator('form button[type="submit"]').click();
      await appPage.waitForTimeout(3500);
    } catch (e) { console.error('  Err 3.1/3.2:', e.message); }

    // 3.3 App Home Dashboard
    try {
      console.log('3.3 Capturing App Home Dashboard...');
      await appPage.goto(`${APP_BASE}/association`, { waitUntil: 'networkidle', timeout: 30000 });
      await appPage.waitForTimeout(2000);
      const buf = await appPage.screenshot();
      saveFiles(buf, [
        '08_app_home_dashboard.png',
        'sub_12_app_home_top_banner.png',
        'app_02_home_dashboard.png'
      ]);
    } catch (e) { console.error('  Err 3.3:', e.message); }

    // 3.4 App Home Scrolled (Compact Events & Quick Actions)
    try {
      console.log('3.4 Capturing App Home Compact Events...');
      await appPage.evaluate(() => window.scrollBy(0, 320));
      await appPage.waitForTimeout(1000);
      const buf = await appPage.screenshot();
      saveFiles(buf, [
        '04_app_home_compact_event.png',
        'app_03_home_compact_event.png'
      ]);
    } catch (e) { console.error('  Err 3.4:', e.message); }

    // 3.5 App VIP Card
    try {
      console.log('3.5 Capturing App VIP Card...');
      await appPage.goto(`${APP_BASE}/association/card`, { waitUntil: 'networkidle', timeout: 30000 });
      await appPage.waitForTimeout(2000);
      const buf = await appPage.screenshot();
      saveFiles(buf, [
        '09_app_vip_card.png',
        'sub_13_app_vip_card_front.png'
      ]);
    } catch (e) { console.error('  Err 3.5:', e.message); }

    // 3.6 NFC Radar Modal
    try {
      console.log('3.6 Capturing App NFC Radar Modal...');
      const nfcBtn = appPage.locator('button:has-text("NFC"), button:has-text("Chạm thẻ"), button:has-text("Mã QR")').first();
      if (await nfcBtn.count() > 0) {
        await nfcBtn.click();
        await appPage.waitForTimeout(1000);
        const buf = await appPage.screenshot();
        saveFiles(buf, [
          'sub_14_app_nfc_radar_modal.png'
        ]);
        await appPage.keyboard.press('Escape');
        await appPage.waitForTimeout(500);
      }
    } catch (e) { console.error('  Err 3.6:', e.message); }

    // 3.7 Public Digital Business Card
    try {
      console.log('3.7 Capturing Public Digital Business Card...');
      await appPage.goto(`${APP_BASE}/card/M1983-007`, { waitUntil: 'networkidle', timeout: 30000 });
      await appPage.waitForTimeout(2000);
      const buf = await appPage.screenshot();
      saveFiles(buf, [
        'sub_15_app_public_digital_card.png'
      ]);
    } catch (e) { console.error('  Err 3.7:', e.message); }

    // 3.8 App Events Screen
    try {
      console.log('3.8 Capturing App Events Screen...');
      await appPage.goto(`${APP_BASE}/association/events`, { waitUntil: 'networkidle', timeout: 30000 });
      await appPage.waitForTimeout(2000);
      const buf = await appPage.screenshot();
      saveFiles(buf, [
        '13_app_events_screen.png',
        'sub_29_app_events_screen.png',
        'app_04_events_list.png'
      ]);
    } catch (e) { console.error('  Err 3.8:', e.message); }

    // 3.9 Event Detail Modal & 3.10 VietQR Payment Modal
    try {
      console.log('3.9 Capturing Event Detail Modal...');
      await appPage.goto(`${APP_BASE}/association/events`, { waitUntil: 'networkidle', timeout: 30000 });
      await appPage.waitForTimeout(1500);
      const viewDetailBtn = appPage.locator('text="Xem chi tiết"').first();
      if (await viewDetailBtn.count() > 0) {
        await viewDetailBtn.click();
        await appPage.waitForTimeout(1500);
        let buf = await appPage.screenshot();
        saveFiles(buf, [
          '06_app_event_detail_modal.png',
          'sub_30_app_event_detail_modal.png',
          'app_05_event_detail_modal.png'
        ]);

        console.log('3.10 Capturing VietQR Payment Modal...');
        const regBtn = appPage.locator('button:has-text("Đăng ký tham gia ngay")').first();
        if (await regBtn.count() > 0) {
          await regBtn.click();
          await appPage.waitForTimeout(1500);
          buf = await appPage.screenshot();
          saveFiles(buf, [
            '08_app_vietqr_payment_modal.png',
            'app_07_vietqr_payment_modal.png'
          ]);
        }
      }
    } catch (e) { console.error('  Err 3.9/3.10:', e.message); }

    // 3.11 Event Check-in Ticket Pass
    try {
      console.log('3.11 Capturing Event Ticket Pass...');
      await appPage.goto(`${APP_BASE}/association/checkin`, { waitUntil: 'networkidle', timeout: 30000 });
      await appPage.waitForTimeout(2000);
      const buf = await appPage.screenshot();
      saveFiles(buf, [
        '14_app_event_checkin_pass.png',
        'sub_31_app_event_ticket_pass.png',
        'app_06_event_ticket_pass.png'
      ]);
    } catch (e) { console.error('  Err 3.11:', e.message); }

    // 3.12 Live Voting Screen
    try {
      console.log('3.12 Capturing App Live Voting...');
      await appPage.goto(`${APP_BASE}/voting`, { waitUntil: 'networkidle', timeout: 30000 });
      await appPage.waitForTimeout(2000);
      const buf = await appPage.screenshot();
      saveFiles(buf, [
        '15_app_live_voting.png',
        'sub_32_app_event_live_voting.png'
      ]);
    } catch (e) { console.error('  Err 3.12:', e.message); }

    // 3.13 Lucky Draw Screen
    try {
      console.log('3.13 Capturing App Lucky Draw...');
      await appPage.goto(`${APP_BASE}/voting`, { waitUntil: 'networkidle', timeout: 30000 });
      await appPage.waitForTimeout(1000);
      const appLuckyBtn = appPage.locator('button:has-text("Bốc Thăm"), button:has-text("Trúng Thưởng")').first();
      if (await appLuckyBtn.count() > 0) {
        await appLuckyBtn.click();
        await appPage.waitForTimeout(1500);
        const buf = await appPage.screenshot();
        saveFiles(buf, [
          'sub_33_app_event_lucky_draw.png'
        ]);
      }
    } catch (e) { console.error('  Err 3.13:', e.message); }

    // 3.14 Products Grid (Marketplace)
    try {
      console.log('3.14 Capturing App Marketplace Products Grid...');
      await appPage.goto(`${APP_BASE}/association/products`, { waitUntil: 'networkidle', timeout: 30000 });
      await appPage.waitForTimeout(2000);
      const buf = await appPage.screenshot();
      saveFiles(buf, [
        '16_app_products_ecommerce_grid.png',
        'sub_34_app_products_grid.png',
        'app_08_products_grid.png'
      ]);
    } catch (e) { console.error('  Err 3.14:', e.message); }

    // 3.15 Product Create Modal
    try {
      console.log('3.15 Capturing Product Create Modal...');
      await appPage.goto(`${APP_BASE}/association/products`, { waitUntil: 'networkidle', timeout: 30000 });
      await appPage.waitForTimeout(1000);
      const addProdBtn = appPage.locator('button:has-text("Đăng sản phẩm"), button:has-text("Thêm sản phẩm")').first();
      if (await addProdBtn.count() > 0) {
        await addProdBtn.click();
        await appPage.waitForTimeout(1500);
        const buf = await appPage.screenshot();
        saveFiles(buf, [
          '17_app_product_created.png',
          'sub_35_app_product_create_modal.png',
          'app_09_product_create_modal.png'
        ]);
      }
    } catch (e) { console.error('  Err 3.15:', e.message); }

    // 3.16 Product Detail Modal & 3-Dots Menu
    try {
      console.log('3.16 Capturing Product Detail Modal & Actions...');
      await appPage.goto(`${APP_BASE}/association/products`, { waitUntil: 'networkidle', timeout: 30000 });
      await appPage.waitForTimeout(1500);
      const prodCard = appPage.locator('.cursor-pointer:has(img), div[role="button"]:has(img), div[class*="rounded"]:has(p)').first();
      if (await prodCard.count() > 0) {
        await prodCard.click();
        await appPage.waitForTimeout(1500);
        const buf = await appPage.screenshot();
        saveFiles(buf, [
          'sub_36_app_product_detail_modal.png',
          '19_app_product_updated.png',
          'sub_38_app_product_3dots_actions.png'
        ]);
      }
    } catch (e) { console.error('  Err 3.16:', e.message); }

    // 3.17 Opportunities Feed
    try {
      console.log('3.17 Capturing App Opportunities Feed...');
      await appPage.goto(`${APP_BASE}/association/opportunities`, { waitUntil: 'networkidle', timeout: 30000 });
      await appPage.waitForTimeout(2000);
      const buf = await appPage.screenshot();
      saveFiles(buf, [
        '20_app_opportunities_feed.png',
        'sub_39_app_opportunities_feed.png',
        'app_10_opportunities_feed.png'
      ]);
    } catch (e) { console.error('  Err 3.17:', e.message); }

    // 3.18 Opportunity Create Modal
    try {
      console.log('3.18 Capturing Opportunity Create Modal...');
      await appPage.goto(`${APP_BASE}/association/opportunities`, { waitUntil: 'networkidle', timeout: 30000 });
      await appPage.waitForTimeout(1000);
      const addOppBtn = appPage.locator('button:has-text("Tạo cơ hội"), button:has-text("Đăng"), button:has-text("+")').first();
      if (await addOppBtn.count() > 0) {
        await addOppBtn.click();
        await appPage.waitForTimeout(1500);
        const buf = await appPage.screenshot();
        saveFiles(buf, [
          '21_app_opp_posted.png',
          'sub_40_app_opportunity_create_modal.png',
          'app_11_opportunity_create_modal.png'
        ]);
      }
    } catch (e) { console.error('  Err 3.18:', e.message); }

    // 3.19 Opportunity Detail & Claim Deal
    try {
      console.log('3.19 Capturing Opportunity Detail & Claim Deal...');
      await appPage.goto(`${APP_BASE}/association/opportunities`, { waitUntil: 'networkidle', timeout: 30000 });
      await appPage.waitForTimeout(1500);
      const oppItem = appPage.locator('.cursor-pointer, [role="button"]').first();
      if (await oppItem.count() > 0) {
        await oppItem.click();
        await appPage.waitForTimeout(1500);
        const buf = await appPage.screenshot();
        saveFiles(buf, [
          '22_app_opp_claimed.png',
          'sub_41_app_opportunity_detail_modal.png'
        ]);
      }
    } catch (e) { console.error('  Err 3.19:', e.message); }

    // 3.20 Members Directory
    try {
      console.log('3.20 Capturing App Members Directory...');
      await appPage.goto(`${APP_BASE}/association/members`, { waitUntil: 'networkidle', timeout: 30000 });
      await appPage.waitForTimeout(2000);
      const buf = await appPage.screenshot();
      saveFiles(buf, [
        '23_app_members_directory.png',
        'sub_16_app_members_directory.png',
        'app_12_members_directory.png'
      ]);
    } catch (e) { console.error('  Err 3.20:', e.message); }

    // 3.21 Invite Member Modal
    try {
      console.log('3.21 Capturing Invite Member Modal...');
      await appPage.goto(`${APP_BASE}/association/members`, { waitUntil: 'networkidle', timeout: 30000 });
      await appPage.waitForTimeout(1000);
      const inviteBtn = appPage.locator('button:has-text("Mời vào CLB"), button:has-text("Mời"), button:has-text("+ Mời")').first();
      if (await inviteBtn.count() > 0) {
        await inviteBtn.click();
        await appPage.waitForTimeout(1500);
        const buf = await appPage.screenshot();
        saveFiles(buf, [
          'sub_19_app_invite_member_modal.png'
        ]);
      }
    } catch (e) { console.error('  Err 3.21:', e.message); }

    // 3.22 Member Profile Modal & Connect Toggle
    try {
      console.log('3.22 Capturing Member 360 Profile Modal & Connection Toggle...');
      await appPage.goto(`${APP_BASE}/association/members`, { waitUntil: 'networkidle', timeout: 30000 });
      await appPage.waitForTimeout(1500);
      const memberCard = appPage.locator('.cursor-pointer:has(img), div[role="button"]:has(img)').first();
      if (await memberCard.count() > 0) {
        await memberCard.click();
        await appPage.waitForTimeout(1500);
        const buf = await appPage.screenshot();
        saveFiles(buf, [
          '10_app_profile_view.png',
          'sub_17_app_member_profile_modal.png',
          'app_13_member_profile_modal.png',
          'sub_18_app_connection_toggle.png'
        ]);
      }
    } catch (e) { console.error('  Err 3.22:', e.message); }

    // 3.23 Messages Inbox
    try {
      console.log('3.23 Capturing Messages Inbox...');
      await appPage.goto(`${APP_BASE}/association/messages`, { waitUntil: 'networkidle', timeout: 30000 });
      await appPage.waitForTimeout(2000);
      const buf = await appPage.screenshot();
      saveFiles(buf, [
        '24_app_messages_inbox.png',
        'sub_20_app_messages_inbox.png',
        'app_14_messages_inbox.png'
      ]);
    } catch (e) { console.error('  Err 3.23:', e.message); }

    // 3.24 Create Group Modal
    try {
      console.log('3.24 Capturing Create Group Modal...');
      await appPage.goto(`${APP_BASE}/association/messages`, { waitUntil: 'networkidle', timeout: 30000 });
      await appPage.waitForTimeout(1000);
      const addGroupBtn = appPage.locator('button:has-text("+"), button[aria-label*="nhóm"]').first();
      if (await addGroupBtn.count() > 0) {
        await addGroupBtn.click();
        await appPage.waitForTimeout(1500);
        const buf = await appPage.screenshot();
        saveFiles(buf, [
          'sub_21_app_create_group_modal.png'
        ]);
      }
    } catch (e) { console.error('  Err 3.24:', e.message); }

    // 3.25 1-1 Chat Conversation, Expander, Call
    try {
      console.log('3.25 Capturing Chat Thread & Messaging Actions...');
      await appPage.goto(`${APP_BASE}/association/messages`, { waitUntil: 'networkidle', timeout: 30000 });
      await appPage.waitForTimeout(1500);
      const composeBtn = appPage.locator('button:has-text("+"), button[aria-label*="nhóm"], button[aria-label*="tin nhắn"]').first();
      if (await composeBtn.count() > 0) {
        await composeBtn.click();
        await appPage.waitForTimeout(1000);
        const firstMember = appPage.locator('div[role="dialog"] button:has(p), div[role="dialog"] button:has(span)').nth(1);
        if (await firstMember.count() > 0) {
          await firstMember.click();
          await appPage.waitForTimeout(2000);
        }
      }

      let chatBuf = await appPage.screenshot();
      saveFiles(chatBuf, [
        '25_app_chat_conversation.png',
        'sub_22_app_chat_1on1_bubble.png',
        'app_15_chat_messenger_thread.png',
        'sub_24_app_chat_location_pin.png',
        'sub_25_app_chat_recalled_msg.png'
      ]);

      // Chat input expander
      const expandBtn = appPage.locator('div.border-t button:has(svg.lucide-plus), div.border-t button:has-text("+")').first();
      if (await expandBtn.count() > 0) {
        await expandBtn.click();
        await appPage.waitForTimeout(800);
        chatBuf = await appPage.screenshot();
        saveFiles(chatBuf, [
          '09_app_chat_call_messenger_bubble.png',
          'sub_23_app_chat_input_expander.png'
        ]);
      }

      // Call button in chat
      const callBtn = appPage.locator('header button:has(svg.lucide-phone), button:has(svg.lucide-phone)').first();
      if (await callBtn.count() > 0) {
        await callBtn.click();
        await appPage.waitForTimeout(1000);
        chatBuf = await appPage.screenshot();
        saveFiles(chatBuf, [
          'sub_26_app_chat_call_popup.png'
        ]);
      }
    } catch (e) { console.error('  Err 3.25:', e.message); }

    // 3.26 Profile Menu
    try {
      console.log('3.26 Capturing Profile Menu & Utilities...');
      await appPage.goto(`${APP_BASE}/association/profile`, { waitUntil: 'networkidle', timeout: 30000 });
      await appPage.waitForTimeout(2000);
      const buf = await appPage.screenshot();
      saveFiles(buf, [
        'sub_43_app_profile_menu.png',
        'sub_44_app_digital_business_cards.png'
      ]);
    } catch (e) { console.error('  Err 3.26:', e.message); }

    // 3.27 Contact Secretariat Modal
    try {
      console.log('3.27 Capturing Contact Secretariat Modal...');
      await appPage.goto(`${APP_BASE}/association/profile`, { waitUntil: 'networkidle', timeout: 30000 });
      await appPage.waitForTimeout(1500);
      const contactSecBtn = appPage.locator('text="Liên hệ Ban Thư Ký CLB CEO 1983"').first();
      if (await contactSecBtn.count() > 0) {
        await contactSecBtn.scrollIntoViewIfNeeded();
        await contactSecBtn.click();
        await appPage.waitForTimeout(1500);
        const buf = await appPage.screenshot();
        saveFiles(buf, [
          'sub_45_app_contact_secretariat_modal.png'
        ]);
        await appPage.keyboard.press('Escape');
        await appPage.waitForTimeout(500);
      }
    } catch (e) { console.error('  Err 3.27:', e.message); }

    // 3.28 In-app User Guide PDF Viewer
    try {
      console.log('3.28 Capturing In-app User Guide Viewer...');
      await appPage.goto(`${APP_BASE}/association/profile`, { waitUntil: 'networkidle', timeout: 30000 });
      await appPage.waitForTimeout(1500);
      const guideBtn = appPage.locator('text="Hướng dẫn sử dụng App Doanh Nhân"').first();
      if (await guideBtn.count() > 0) {
        await guideBtn.scrollIntoViewIfNeeded();
        await guideBtn.click();
        await appPage.waitForTimeout(2500);
        const buf = await appPage.screenshot();
        saveFiles(buf, [
          '10_app_user_guide_pdf_viewer.png',
          'sub_46_app_user_guide_modal.png',
          'app_16_user_guide_pdf_viewer.png'
        ]);
      }
    } catch (e) { console.error('  Err 3.28:', e.message); }

    // 3.29 Settings & Password Security
    try {
      console.log('3.29 Capturing Settings & Password Security...');
      await appPage.goto(`${APP_BASE}/association/settings`, { waitUntil: 'networkidle', timeout: 30000 });
      await appPage.waitForTimeout(2000);
      const buf = await appPage.screenshot();
      saveFiles(buf, [
        '11_app_settings_password.png',
        'sub_47_app_settings_password_security.png'
      ]);
    } catch (e) { console.error('  Err 3.29:', e.message); }

    // 3.30 Notifications Screen
    try {
      console.log('3.30 Capturing Notifications Screen...');
      await appPage.goto(`${APP_BASE}/association/notifications`, { waitUntil: 'networkidle', timeout: 30000 });
      await appPage.waitForTimeout(2000);
      const buf = await appPage.screenshot();
      saveFiles(buf, [
        '26_app_notifications_personal.png',
        'sub_48_app_notifications_screen.png'
      ]);
    } catch (e) { console.error('  Err 3.30:', e.message); }

    // 3.31 News Screen
    try {
      console.log('3.31 Capturing News Screen...');
      await appPage.goto(`${APP_BASE}/association/news`, { waitUntil: 'networkidle', timeout: 30000 });
      await appPage.waitForTimeout(2000);
      const buf = await appPage.screenshot();
      saveFiles(buf, [
        'sub_49_app_news_screen.png'
      ]);
    } catch (e) { console.error('  Err 3.31:', e.message); }

    console.log('\n===============================================================');
    console.log('ALL EVIDENCE SCREENSHOTS CAPTURED AND SAVED SUCCESSFULLY!');
    console.log('===============================================================');

  } catch (err) {
    console.error('Fatal capture error:', err);
  } finally {
    await browser.close();
  }
}

captureAllEvidence();
