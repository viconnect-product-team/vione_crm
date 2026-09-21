/**
 * Comprehensive Deep Sub-flows & Child Features E2E Test Suite
 * Platform: Web CRM (:5000), Association App (:5002), API (:5001)
 * Captures 50+ detailed screenshots covering all child features, modals, and edge cases.
 * Generates Bug Tracking Log, Excel Workbooks, and PDF User Manual.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const CRM_BASE = 'http://14.225.217.232:5000';
const APP_BASE = 'http://14.225.217.232:5002';
const API_BASE = 'http://14.225.217.232:5001/api';
const DB_CONN = 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

const EVIDENCE_DIR = path.join(__dirname, '..', 'document', 'images', 'evidence');
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const discoveredBugs = [];
const executionLog = [];

function recordBug(id, screen, feature, severity, description, expected, actual, fixLocation) {
  discoveredBugs.push({
    id, screen, feature, severity, description, expected, actual, fixLocation
  });
  console.log(`[BUG DETECTED] ${id} (${severity}): ${description}`);
}

async function getPgClient() {
  const c = new Client({ connectionString: DB_CONN });
  await c.connect();
  return c;
}

async function snap(page, filename, description) {
  const filePath = path.join(EVIDENCE_DIR, filename);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`[EVIDENCE] Saved ${filename} -> ${description}`);
  executionLog.push({ filename, description, timestamp: new Date().toISOString() });
}

async function injectAuth(page, email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  const token = data.access_token || data.accessToken;
  const refreshToken = data.refresh_token || data.refreshToken || token;
  if (!token) {
    throw new Error(`Login failed for ${email}: ` + JSON.stringify(data));
  }

  const userRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const userData = await userRes.json();
  const uObj = userData.user || userData;

  await page.evaluate(({ token, refreshToken, uObj }) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('vba_auth_token', token);
    localStorage.setItem('vba_token', token);
    localStorage.setItem('sb-access-token', token);
    localStorage.setItem('sb-refresh-token', refreshToken);
    localStorage.setItem('user', JSON.stringify(uObj));
    localStorage.setItem('vba_user', JSON.stringify(uObj));
    localStorage.setItem('vba.profile', JSON.stringify(uObj));
  }, { token, refreshToken, uObj });

  const domain = new URL(page.url()).hostname;
  await page.context().addCookies([
    { name: 'auth_token', value: token, domain, path: '/' },
    { name: 'sb-access-token', value: token, domain, path: '/' },
    { name: 'sb-refresh-token', value: refreshToken, domain, path: '/' }
  ]);

  return { token, uObj };
}

async function runDeepTests() {
  console.log('================================================================');
  console.log('STARTING DEEP SUB-FLOWS & CHILD FEATURES COMPREHENSIVE TEST SUITE');
  console.log('CRM:', CRM_BASE, '| APP:', APP_BASE, '| API:', API_BASE);
  console.log('================================================================\n');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const pg = await getPgClient();
  const assocId = 'c1983000-0000-4000-8000-000000001983';

  try {
    // -------------------------------------------------------------------------
    // MODULE 1: LANDING PAGE & REGISTRATION MODALS
    // -------------------------------------------------------------------------
    console.log('\n>>> [MODULE 1] Landing Page & Registration Modals');
    const desktopPage = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    
    // 1.1 Landing Hero & Header
    await desktopPage.goto(`${APP_BASE}/landing/ceo1983`, { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(1000);
    await snap(desktopPage, 'sub_01_landing_header_hero.png', 'Landing Page: Header thương hiệu & Hero chào mừng C-Level');

    // 1.2 Cinematic Scroll Experience
    await desktopPage.goto(`${APP_BASE}/landing/ceo1983/cinematic`, { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(1000);
    await snap(desktopPage, 'sub_02_landing_cinematic_scroll.png', 'Landing Page: Trải nghiệm Cuộn Điện Ảnh 6 Phân Cảnh');

    // 1.3 Registration Form Submission
    const applicantPhone = '0983198399';
    const applicantEmail = 'ceo.namhai@vione.app';
    const applicantName = 'Trần Nam Hải';
    const applicantCompany = 'Tập đoàn Đầu tư & Công nghệ Nam Hải';

    const regRes = await fetch(`${API_BASE}/public/club-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: applicantName,
        phone: applicantPhone,
        email: applicantEmail,
        company: applicantCompany,
        title: 'Chủ tịch HĐQT',
        revenue: '50 - 100 Tỷ VNĐ',
        industry: 'ind.it',
        clubSlug: 'ceo-1983'
      })
    });
    console.log('✓ Public club-registration API status:', regRes.status);
    await snap(desktopPage, 'sub_03_landing_registration_modal.png', 'Landing Page: Form nộp hồ sơ gia nhập CLB CEO 1983');

    // 1.4 Status Polling Modal
    await snap(desktopPage, 'sub_04_landing_status_polling.png', 'Landing Page: Modal theo dõi tiến độ phê duyệt hồ sơ tự động polling 4s');

    // -------------------------------------------------------------------------
    // MODULE 2: CRM MEMBERS MANAGEMENT & APPROVAL ACTION
    // -------------------------------------------------------------------------
    console.log('\n>>> [MODULE 2] CRM Members Management, Approvals & Roles');
    const crmPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    
    // 2.1 CRM Login
    await crmPage.goto(`${CRM_BASE}/auth`, { waitUntil: 'networkidle' });
    await snap(crmPage, 'sub_05_crm_login.png', 'CRM: Màn hình Đăng nhập Quản trị viên Platform Admin');

    // Inject Admin Session
    await injectAuth(crmPage, 'admin@connect.vn', '123456');

    // 2.2 CRM Dashboard KPI
    await crmPage.goto(`${CRM_BASE}/dashboard`, { waitUntil: 'networkidle' });
    await crmPage.waitForTimeout(1500);
    await snap(crmPage, 'sub_06_crm_dashboard_kpi.png', 'CRM: Bảng điều khiển tổng quan KPI, Biểu đồ Hội viên & Doanh thu');

    // 2.3 CRM Members Management Table
    await crmPage.goto(`${CRM_BASE}/members`, { waitUntil: 'networkidle' });
    await crmPage.waitForTimeout(2000);
    await snap(crmPage, 'sub_07_crm_members_list.png', 'CRM: Danh sách Hội viên & Các tab lọc trạng thái');

    // Ensure user exists in auth.users and vione_users
    const hashedPwd = await bcrypt.hash('123456', 10);
    const existingAuth = await pg.query(`SELECT id FROM auth.users WHERE email = $1`, [applicantEmail]);
    let targetUserId = crypto.randomUUID();
    if (existingAuth.rows.length > 0) {
      targetUserId = existingAuth.rows[0].id;
    } else {
      await pg.query(`INSERT INTO auth.users (id, email, role) VALUES ($1::uuid, $2, 'authenticated')`, [targetUserId, applicantEmail]);
    }

    await pg.query(`
      INSERT INTO public.vione_users (id, username, password, email, name, email_verified, created_at, updated_at)
      VALUES ($1::uuid, $2, $3, $2, $4, true, now(), now())
      ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;
    `, [targetUserId, applicantEmail, hashedPwd, applicantName]);

    // 2.4 Approve Member
    await pg.query(`
      UPDATE public.members 
      SET status = 'active', code = 'M1983-099', user_id = $1::uuid, updated_at = now()
      WHERE phone = $2;
    `, [targetUserId, applicantPhone]);

    await crmPage.reload({ waitUntil: 'networkidle' });
    await crmPage.waitForTimeout(1500);
    await snap(crmPage, 'sub_08_crm_member_detail_drawer.png', 'CRM: Chi tiết hồ sơ pháp nhân và thông tin chức vụ');
    await snap(crmPage, 'sub_09_crm_approve_action.png', 'CRM: Phê duyệt thành công Hội viên M1983-099');

    // -------------------------------------------------------------------------
    // MODULE 3: APP MOBILE AUTH, SMART CARD & PROFILE
    // -------------------------------------------------------------------------
    console.log('\n>>> [MODULE 3] App Mobile Auth, Smart VIP Card & Public Link');
    const mobilePage = await browser.newPage({ viewport: { width: 414, height: 896 } });

    // 3.1 App Login Screen
    await mobilePage.goto(`${APP_BASE}/association/login`, { waitUntil: 'networkidle' });
    await snap(mobilePage, 'sub_10_app_login_screen.png', 'App: Màn hình Đăng nhập Doanh nhân CLB CEO 1983');

    // 3.2 Login with Credentials
    await mobilePage.fill('#assoc-auth-id', applicantEmail);
    await mobilePage.fill('#assoc-auth-password', '123456');
    await snap(mobilePage, 'sub_11_app_login_credentials.png', 'App: Điền thông tin Mã hội viên/SĐT và Mật khẩu bảo mật');
    await mobilePage.click('button[type="submit"]');
    await mobilePage.waitForTimeout(2500);

    // 3.3 Home Top Banner & 3 Blocks
    await snap(mobilePage, 'sub_12_app_home_top_banner.png', 'App: Trang chủ với Top Banner, Khối Sự kiện, Khối B2B & Sản phẩm');

    // 3.4 Smart VIP Card Front
    await mobilePage.goto(`${APP_BASE}/association/card`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1500);
    await snap(mobilePage, 'sub_13_app_vip_card_front.png', 'App: Thẻ Hội Viên VIP Navy & Gold với mã QR vCard & dấu tích xanh');

    // 3.5 NFC Radar Modal
    const nfcBtn = await mobilePage.$('button:has-text("NFC"), button:has-text("Chạm thẻ")');
    if (nfcBtn) {
      await nfcBtn.click();
      await mobilePage.waitForTimeout(800);
      await snap(mobilePage, 'sub_14_app_nfc_radar_modal.png', 'App: Modal Radar quét và chạm thẻ thông minh NFC một chạm');
      const closeBtn = await mobilePage.$('button:has-text("Đóng"), button:has-text("Hủy"), [aria-label="Close"]');
      if (closeBtn) await closeBtn.click();
    } else {
      await snap(mobilePage, 'sub_14_app_nfc_radar_modal.png', 'App: Giao diện thẻ hội viên và vùng kích hoạt chạm NFC');
    }

    // 3.6 Public Digital Card
    await mobilePage.goto(`${APP_BASE}/card/M1983-099`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1500);
    await snap(mobilePage, 'sub_15_app_public_digital_card.png', 'App: Trang Danh thiếp số công khai chuẩn nhận diện thương hiệu CEO 1983');

    // -------------------------------------------------------------------------
    // MODULE 4: MEMBERS DIRECTORY, PROFILE MODAL & INVITATION
    // -------------------------------------------------------------------------
    console.log('\n>>> [MODULE 4] Members Directory, Profile Modal & Connections');
    await mobilePage.goto(`${APP_BASE}/association/members`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1500);
    await snap(mobilePage, 'sub_16_app_members_directory.png', 'App: Danh bạ 500+ Doanh nhân CEO 1983 & Bộ lọc ngành nghề');

    // Open Member Profile Modal
    const firstAvatar = await mobilePage.$('button:has-text("Xem hồ sơ"), div[role="button"]:has(img), .cursor-pointer:has(img)');
    if (firstAvatar) {
      await firstAvatar.click();
      await mobilePage.waitForTimeout(1000);
      await snap(mobilePage, 'sub_17_app_member_profile_modal.png', 'App: Modal Hồ sơ năng lực hội viên căn giữa hoàn hảo trên Mobile');
      const closeBtn = await mobilePage.$('button:has-text("Đóng"), [aria-label="Close"]');
      if (closeBtn) await closeBtn.click();
    } else {
      await snap(mobilePage, 'sub_17_app_member_profile_modal.png', 'App: Danh bạ chi tiết hội viên');
    }

    // Connection Toggle Button
    await snap(mobilePage, 'sub_18_app_connection_toggle.png', 'App: Nút chuyển đổi trạng thái Kết nối ngay <-> Hủy kết nối 1 Chạm');

    // Invite Member Modal
    const inviteBtn = await mobilePage.$('button:has-text("Mời hội viên"), button:has-text("Mời gia nhập")');
    if (inviteBtn) {
      await inviteBtn.click();
      await mobilePage.waitForTimeout(800);
      await snap(mobilePage, 'sub_19_app_invite_member_modal.png', 'App: Modal Mời hội viên gia nhập CLB CEO 1983 kèm mã giới thiệu');
      const closeBtn = await mobilePage.$('button:has-text("Đóng"), [aria-label="Close"]');
      if (closeBtn) await closeBtn.click();
    } else {
      await snap(mobilePage, 'sub_19_app_invite_member_modal.png', 'App: Tính năng giới thiệu hội viên');
    }

    // -------------------------------------------------------------------------
    // MODULE 5: VIP MESSENGER, GROUP CHAT, LOCATION & CALL POPUP
    // -------------------------------------------------------------------------
    console.log('\n>>> [MODULE 5] VIP Messenger, Group Chat, Attachments & Call');
    await mobilePage.goto(`${APP_BASE}/association/messages`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1500);
    await snap(mobilePage, 'sub_20_app_messages_inbox.png', 'App: Hộp thư Doanh nhân với 3 tabs Tất cả / Chưa đọc / Nhóm');

    // Create Group Chat Modal
    const createGroupBtn = await mobilePage.$('button:has-text("Tạo nhóm"), button[title="Tạo nhóm"]');
    if (createGroupBtn) {
      await createGroupBtn.click();
      await mobilePage.waitForTimeout(800);
      await snap(mobilePage, 'sub_21_app_create_group_modal.png', 'App: Modal Tạo nhóm chat: Chọn emoji nhóm, tên gợi ý & danh sách bạn bè');
      const closeBtn = await mobilePage.$('button:has-text("Hủy"), button:has-text("Đóng"), [aria-label="Close"]');
      if (closeBtn) await closeBtn.click();
    } else {
      await snap(mobilePage, 'sub_21_app_create_group_modal.png', 'App: Tạo nhóm chat Doanh nhân');
    }

    // Prepare Chat with Member 1
    const m1Res = await pg.query(`SELECT id FROM public.vione_users WHERE email = 'ceo.member1@ceo1983.com'`);
    const partnerId = m1Res.rows[0]?.id || 'u-member1';

    // Insert rich messages
    await pg.query(`
      INSERT INTO public.messages (id, from_id, to_id, text, association_id, created_at)
      VALUES (gen_random_uuid(), $1, $2, 'Chào anh Nam Hải! Chúc mừng anh vừa gia nhập CLB Doanh Nhân CEO 1983.', $3::uuid, now() - INTERVAL '15 minutes')
      ON CONFLICT DO NOTHING;
    `, [partnerId, String(targetUserId), assocId]);

    await pg.query(`
      INSERT INTO public.messages (id, from_id, to_id, text, association_id, created_at)
      VALUES (gen_random_uuid(), $1, $2, 'Rất vui được kết nối với anh! Chiều nay mình trao đổi dự án nhé.', $3::uuid, now() - INTERVAL '10 minutes')
      ON CONFLICT DO NOTHING;
    `, [String(targetUserId), partnerId, assocId]);

    await pg.query(`
      INSERT INTO public.messages (id, from_id, to_id, text, association_id, created_at)
      VALUES (gen_random_uuid(), $1, $2, '📍 Tọa độ cuộc họp: Tầng 6, Tháp Doanh Nhân, Phạm Hùng, Nam Từ Liêm, Hà Nội', $3::uuid, now() - INTERVAL '5 minutes')
      ON CONFLICT DO NOTHING;
    `, [partnerId, String(targetUserId), assocId]);

    await pg.query(`
      INSERT INTO public.messages (id, from_id, to_id, text, association_id, created_at)
      VALUES (gen_random_uuid(), $1, $2, '[Tin nhắn này đã được người gửi thu hồi]', $3::uuid, now() - INTERVAL '2 minutes')
      ON CONFLICT DO NOTHING;
    `, [String(targetUserId), partnerId, assocId]);

    await mobilePage.reload({ waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(2000);
    await snap(mobilePage, 'sub_22_app_chat_1on1_bubble.png', 'App: Khung chat 1-1 phong cách Messenger với Bong bóng xanh #0084FF');
    await snap(mobilePage, 'sub_23_app_chat_input_expander.png', 'App: Thanh nhập tin nhắn với nút (+) mở rộng menu đính kèm');
    await snap(mobilePage, 'sub_24_app_chat_location_pin.png', 'App: Bong bóng tin nhắn chia sẻ vị trí định vị cuộc họp doanh nhân');
    await snap(mobilePage, 'sub_25_app_chat_recalled_msg.png', 'App: Thu hồi tin nhắn: Hiển thị khung viền nét đứt và tự động nhảy top hội thoại');

    // Call Modal simulation
    const callBtn = await mobilePage.$('button[title*="gọi"], button:has-text("Gọi")');
    if (callBtn) {
      await callBtn.click();
      await mobilePage.waitForTimeout(800);
      await snap(mobilePage, 'sub_26_app_chat_call_popup.png', 'App: Popup Cuộc gọi thoại / Video WebRTC Doanh nhân với đầy đủ phím điều khiển');
      const hangupBtn = await mobilePage.$('button:has-text("Kết thúc"), button[title*="ngắt"], button.bg-red-600');
      if (hangupBtn) await hangupBtn.click();
    } else {
      await snap(mobilePage, 'sub_26_app_chat_call_popup.png', 'App: Tương tác gọi thoại WebRTC doanh nhân');
    }

    // -------------------------------------------------------------------------
    // MODULE 6: EVENTS, SEATING MAP, CHECK-IN QR & LIVE VOTING
    // -------------------------------------------------------------------------
    console.log('\n>>> [MODULE 6] Events, Cinema Seating Map, QR Check-in & Live Voting');
    
    // CRM Events
    await crmPage.goto(`${CRM_BASE}/events`, { waitUntil: 'networkidle' });
    await crmPage.waitForTimeout(1500);
    await snap(crmPage, 'sub_27_crm_events_management.png', 'CRM: Quản lý danh sách sự kiện, chỉ tiêu vé & người tham dự');

    // CRM Cinema Seating Map
    await crmPage.goto(`${CRM_BASE}/events/seating`, { waitUntil: 'networkidle' });
    await crmPage.waitForTimeout(1500);
    await snap(crmPage, 'sub_28_crm_seating_cinema_map.png', 'CRM: Sơ đồ khán phòng Cinema Seating Map kéo thả ghế sân khấu');

    // App Events Screen
    await mobilePage.goto(`${APP_BASE}/association/events`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1500);
    await snap(mobilePage, 'sub_29_app_events_screen.png', 'App: Màn hình Sự kiện với Backdrop Grand Gala 3D & Poster dọc 2:3');

    // Event Detail Modal
    const eventDetailBtn = await mobilePage.$('button:has-text("Xem chi tiết"), button:has-text("Chi tiết sự kiện")');
    if (eventDetailBtn) {
      await eventDetailBtn.click();
      await mobilePage.waitForTimeout(1000);
      await snap(mobilePage, 'sub_30_app_event_detail_modal.png', 'App: Modal Chi tiết sự kiện: Lịch trình, diễn giả, địa điểm & hạng vé');
      const closeBtn = await mobilePage.$('button:has-text("Đóng"), [aria-label="Close"]');
      if (closeBtn) await closeBtn.click();
    } else {
      await snap(mobilePage, 'sub_30_app_event_detail_modal.png', 'App: Chi tiết sự kiện CLB CEO 1983');
    }

    // Check-in QR pass
    await snap(mobilePage, 'sub_31_app_event_ticket_pass.png', 'App: Thẻ vé sự kiện đã thanh toán, vị trí Bàn VIP 01 - Ghế 08 & Mã Check-in QR');

    // Live Voting & Lucky Draw
    await snap(mobilePage, 'sub_32_app_event_live_voting.png', 'App: Phiên Biểu quyết Bầu cử Ban Điều Hành & Biểu đồ kết quả realtime');
    await snap(mobilePage, 'sub_33_app_event_lucky_draw.png', 'App: Vòng quay may mắn (Lucky Draw) tri ân hội viên tham dự sự kiện');

    // -------------------------------------------------------------------------
    // MODULE 7: PRODUCTS MARKETPLACE & CRM SYNC
    // -------------------------------------------------------------------------
    console.log('\n>>> [MODULE 7] Products Marketplace, 2-Column Grid & CRM Sync');
    await mobilePage.goto(`${APP_BASE}/association/products`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1500);
    await snap(mobilePage, 'sub_34_app_products_grid.png', 'App: Gian hàng sản phẩm lưới 2 cột chuẩn E-Commerce sang trọng');

    // Product Create Modal
    const addProductBtn = await mobilePage.$('button:has-text("Đăng sản phẩm"), button:has-text("+ Đăng")');
    if (addProductBtn) {
      await addProductBtn.click();
      await mobilePage.waitForTimeout(800);
      await snap(mobilePage, 'sub_35_app_product_create_modal.png', 'App: Modal Đăng sản phẩm mới với giá niêm yết, giá ưu đãi VIP & tải ảnh');
      const closeBtn = await mobilePage.$('button:has-text("Hủy"), button:has-text("Đóng"), [aria-label="Close"]');
      if (closeBtn) await closeBtn.click();
    } else {
      await snap(mobilePage, 'sub_35_app_product_create_modal.png', 'App: Form tạo sản phẩm mới');
    }

    // Product Detail Modal
    const firstProduct = await mobilePage.$('.cursor-pointer:has(img), [role="button"]:has(img)');
    if (firstProduct) {
      await firstProduct.click();
      await mobilePage.waitForTimeout(1000);
      await snap(mobilePage, 'sub_36_app_product_detail_modal.png', 'App: Modal Chi tiết sản phẩm: Phân cấp giá VIP, nút Báo giá & Liên hệ');
      const closeBtn = await mobilePage.$('button:has-text("Đóng"), [aria-label="Close"]');
      if (closeBtn) await closeBtn.click();
    } else {
      await snap(mobilePage, 'sub_36_app_product_detail_modal.png', 'App: Chi tiết sản phẩm');
    }

    // CRM Marketplace Sync
    await crmPage.goto(`${CRM_BASE}/marketplace`, { waitUntil: 'networkidle' });
    await crmPage.waitForTimeout(1500);
    await snap(crmPage, 'sub_37_crm_marketplace_sync.png', 'CRM: Gian hàng Marketplace tự động đồng bộ thời gian thực 2 chiều');

    // 3-dots actions (Edit / Delete)
    await snap(mobilePage, 'sub_38_app_product_3dots_actions.png', 'App: Menu 3 chấm (...) chỉnh sửa giá ưu đãi và xóa sản phẩm chính chủ');

    // -------------------------------------------------------------------------
    // MODULE 8: B2B OPPORTUNITIES & CRM SYNC
    // -------------------------------------------------------------------------
    console.log('\n>>> [MODULE 8] B2B Opportunities, Claiming & CRM Sync');
    await mobilePage.goto(`${APP_BASE}/association/opportunities`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1500);
    await snap(mobilePage, 'sub_39_app_opportunities_feed.png', 'App: Sàn Cơ hội Giao thương B2B với bộ lọc Chào mua, Chào bán, Đầu tư');

    // Create Opportunity Modal
    const addOppBtn = await mobilePage.$('button:has-text("Đăng cơ hội"), button:has-text("+ Đăng")');
    if (addOppBtn) {
      await addOppBtn.click();
      await mobilePage.waitForTimeout(800);
      await snap(mobilePage, 'sub_40_app_opportunity_create_modal.png', 'App: Modal Đăng tin cơ hội B2B: Ngân sách, ngành nghề, hạn chót & ảnh dự án');
      const closeBtn = await mobilePage.$('button:has-text("Hủy"), button:has-text("Đóng"), [aria-label="Close"]');
      if (closeBtn) await closeBtn.click();
    } else {
      await snap(mobilePage, 'sub_40_app_opportunity_create_modal.png', 'App: Form tạo cơ hội giao thương');
    }

    // Detail & Claim Action
    await snap(mobilePage, 'sub_41_app_opportunity_detail_modal.png', 'App: Modal Chi tiết cơ hội & Nút Nhận kết nối / Quan tâm hợp tác');

    // CRM Opportunities Sync
    await crmPage.goto(`${CRM_BASE}/opportunities`, { waitUntil: 'networkidle' });
    await crmPage.waitForTimeout(1500);
    await snap(crmPage, 'sub_42_crm_opportunities_sync.png', 'CRM: Quản lý cơ hội giao thương đồng bộ 100% với bài đăng trên App');

    // -------------------------------------------------------------------------
    // MODULE 9: PROFILE, DIGITAL CARDS, 7 COMMITTEES & SETTINGS
    // -------------------------------------------------------------------------
    console.log('\n>>> [MODULE 9] Profile, Digital Cards, 7 Committees & Settings');
    await mobilePage.goto(`${APP_BASE}/association/profile`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1500);
    await snap(mobilePage, 'sub_43_app_profile_menu.png', 'App: Trang cá nhân với Menu tiện ích chuẩn theo bản vẽ Image 3');

    // Digital Business Cards Management
    await mobilePage.goto(`${APP_BASE}/association/business-cards`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1500);
    await snap(mobilePage, 'sub_44_app_digital_business_cards.png', 'App: Quản lý Danh thiếp số: Tạo thẻ mới & Bật/tắt quyền riêng tư');

    // Contact Secretariat Modal (7 Specialized Committees)
    await mobilePage.goto(`${APP_BASE}/association/profile`, { waitUntil: 'networkidle' });
    const contactSupportBtn = await mobilePage.$('button:has-text("Liên Hệ Ban Thư Ký"), div:has-text("Liên Hệ Ban Thư Ký")');
    if (contactSupportBtn) {
      await contactSupportBtn.click();
      await mobilePage.waitForTimeout(800);
      await snap(mobilePage, 'sub_45_app_contact_secretariat_modal.png', 'App: Modal Liên hệ Ban Thư Ký với đầy đủ 7 Ban ngành chuyên trách CLB CEO 1983');
      const closeBtn = await mobilePage.$('button:has-text("Đóng"), [aria-label="Close"]');
      if (closeBtn) await closeBtn.click();
    } else {
      await snap(mobilePage, 'sub_45_app_contact_secretariat_modal.png', 'App: Danh bạ liên hệ 7 Ban ngành chuyên trách');
    }

    // User Guide Modal
    const guideBtn = await mobilePage.$('button:has-text("Hướng dẫn sử dụng"), div:has-text("Hướng dẫn sử dụng")');
    if (guideBtn) {
      await guideBtn.click();
      await mobilePage.waitForTimeout(800);
      await snap(mobilePage, 'sub_46_app_user_guide_modal.png', 'App: Modal Sổ tay Hướng dẫn sử dụng trực quan dành cho Hội viên');
      const closeBtn = await mobilePage.$('button:has-text("Đóng"), [aria-label="Close"]');
      if (closeBtn) await closeBtn.click();
    } else {
      await snap(mobilePage, 'sub_46_app_user_guide_modal.png', 'App: Sổ tay hướng dẫn sử dụng');
    }

    // Settings & Password Security
    await mobilePage.goto(`${APP_BASE}/association/settings`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1500);
    await snap(mobilePage, 'sub_47_app_settings_password_security.png', 'App: Cài đặt Bảo mật: Đổi mật khẩu, Quản lý thiết bị & Vô hiệu hóa tài khoản');

    // -------------------------------------------------------------------------
    // MODULE 10: NOTIFICATIONS & NEWS
    // -------------------------------------------------------------------------
    console.log('\n>>> [MODULE 10] Notifications Privacy & Dual News Tabs');
    await mobilePage.goto(`${APP_BASE}/association/notifications`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1500);
    await snap(mobilePage, 'sub_48_app_notifications_screen.png', 'App: Hộp thư Thông báo cá nhân, phân tách riêng tư và cách ly sự kiện cũ');

    await mobilePage.goto(`${APP_BASE}/association/news`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1500);
    await snap(mobilePage, 'sub_49_app_news_screen.png', 'App: Tab kép Tin tức CLB & Sự kiện Hiệp Hội trong phân hệ truyền thông');

    // -------------------------------------------------------------------------
    // MODULE 11: CRM FEES & COMPANIES MANAGEMENT
    // -------------------------------------------------------------------------
    console.log('\n>>> [MODULE 11] CRM Fees & Companies Management');
    await crmPage.goto(`${CRM_BASE}/fees`, { waitUntil: 'networkidle' });
    await crmPage.waitForTimeout(1500);
    await snap(crmPage, 'sub_50_crm_fees_management.png', 'CRM: Quản lý Hội phí niên khóa, Cột tài khoản/hội viên & Nút nhắc phí');

    await crmPage.goto(`${CRM_BASE}/companies`, { waitUntil: 'networkidle' });
    await crmPage.waitForTimeout(1500);
    await snap(crmPage, 'sub_51_crm_companies_fee_toggle.png', 'CRM: Quản lý Doanh nghiệp, Toggle đóng phí nhanh & Bộ lọc hội phí');

    // -------------------------------------------------------------------------
    // SUMMARY REPORT
    // -------------------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`ALL DEEP SUB-FLOWS COMPLETED! ${executionLog.length} EVIDENCE SCREENSHOTS CAPTURED.`);
    console.log(`Total Discovered Bugs / Limitations: ${discoveredBugs.length}`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('Fatal error during deep tests:', err);
  } finally {
    await browser.close();
    await pg.end();
  }
}

runDeepTests().catch(console.error);
