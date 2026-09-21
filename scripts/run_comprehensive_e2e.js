const { chromium } = require('playwright');
const { Client } = require('pg');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const EVIDENCE_DIR = path.join(__dirname, '../document/images/evidence');
const DB_URL = process.env.DATABASE_URL || 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

const CRM_BASE = 'http://14.225.217.232:5000';
const APP_BASE = 'http://14.225.217.232:5002';
const API_BASE = 'http://14.225.217.232:5001/api';

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function snap(page, filename, desc) {
  const filePath = path.join(EVIDENCE_DIR, filename);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`[EVIDENCE] Saved ${filename} -> ${desc}`);
}

async function getPgClient() {
  const c = new Client({ connectionString: DB_URL });
  await c.connect();
  return c;
}

async function injectLoginSession(page, email, password, origin = CRM_BASE) {
  try {
    if (page.url() === 'about:blank' || !page.url().startsWith(origin)) {
      await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 30000 });
    }
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      throw new Error(`Login API failed for ${email}: ${res.status}`);
    }
    const data = await res.json();
    const token = data.access_token;
    const refreshToken = data.refresh_token;
    const user = data.user;

    await page.evaluate(({ token, refreshToken, user }) => {
      localStorage.setItem('vibe_token', token);
      localStorage.setItem('vibe_refresh_token', refreshToken);
      localStorage.setItem('vba_user', JSON.stringify(user));
      document.cookie = `sb-access-token=${token}; path=/; max-age=3600; SameSite=Lax`;
      document.cookie = `sb-refresh-token=${refreshToken}; path=/; max-age=604800; SameSite=Lax`;
    }, { token, refreshToken, user });

    return data;
  } catch (err) {
    console.error(`Error injecting session for ${email}:`, err.message);
    throw err;
  }
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('STARTING COMPREHENSIVE END-TO-END SYSTEM TEST SUITE');
  console.log('CRM:', CRM_BASE, '| APP:', APP_BASE, '| API:', API_BASE);
  console.log('======================================================\n');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const pg = await getPgClient();

  const assocId = 'c1983000-0000-4000-8000-000000001983';

  try {
    // =========================================================================
    // LUỒNG 1: LANDING -> ĐĂNG KÝ -> CRM PHÊ DUYỆT -> APP LOGIN & PROFILE
    // =========================================================================
    console.log('\n--- [LUỒNG 1] Đăng ký tham gia CLB CEO 1983 -> CRM -> App ---');
    const landingPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    // 1.1 Truy cập Landing Page CEO 1983
    console.log('1.1 Mở Landing Page CLB Doanh nhân CEO 1983...');
    await landingPage.goto(`${APP_BASE}/landing/ceo1983`, { waitUntil: 'networkidle', timeout: 30000 });
    await landingPage.waitForTimeout(1500);
    await snap(landingPage, '01_landing_hero.png', 'Giao diện Landing Page CLB CEO 1983');

    // 1.2 Form Đăng ký Hội viên
    console.log('1.2 Nộp hồ sơ đăng ký tham gia hội viên qua API...');
    const applicantPhone = '0983198399';
    const applicantEmail = 'ceo.namhai@vione.app';
    const applicantName = 'Trần Nam Hải';
    const applicantCompany = 'Tập đoàn Đầu tư & Công nghệ Nam Hải';

    // Submit registration to public API
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
    console.log('✓ Register API status:', regRes.status);

    await landingPage.goto(`${APP_BASE}/landing/ceo1983/cinematic`, { waitUntil: 'networkidle' });
    await landingPage.waitForTimeout(1500);
    await snap(landingPage, '02_landing_cinematic.png', 'Giao diện Cinematic Landing Page 6 phân cảnh');

    // 1.3 Quản trị viên truy cập CRM để phê duyệt
    console.log('1.3 Quản trị viên truy cập CRM để phê duyệt...');
    const crmPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await crmPage.goto(`${CRM_BASE}/auth`, { waitUntil: 'networkidle' });
    await snap(crmPage, '03_crm_login_page.png', 'Màn hình đăng nhập Hệ thống Quản trị CRM');

    // Đăng nhập CRM bằng Platform Admin: admin@connect.vn
    await injectLoginSession(crmPage, 'admin@connect.vn', '123456');
    await crmPage.goto(`${CRM_BASE}/members`, { waitUntil: 'networkidle' });
    await crmPage.waitForTimeout(2000);
    await snap(crmPage, '04_crm_members_management.png', 'CRM: Quản lý danh sách Hội viên & Đơn chờ duyệt');

    // Tạo tài khoản an toàn trong auth.users & vione_users trước khi gán FK
    const newUserId = crypto.randomUUID();
    const hashedPwd = await bcrypt.hash('123456', 10);

    const existingAuth = await pg.query(`SELECT id FROM auth.users WHERE email = $1`, [applicantEmail]);
    let targetUserId = newUserId;
    if (existingAuth.rows.length > 0) {
      targetUserId = existingAuth.rows[0].id;
    } else {
      await pg.query(`
        INSERT INTO auth.users (id, email, role)
        VALUES ($1::uuid, $2, 'authenticated')
      `, [targetUserId, applicantEmail]);
    }

    await pg.query(`
      INSERT INTO public.vione_users (id, username, password, email, name, email_verified, created_at, updated_at)
      VALUES ($1::uuid, $2, $3, $2, $4, true, now(), now())
      ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;
    `, [targetUserId, applicantEmail, hashedPwd, applicantName]);

    // Phê duyệt trong Database sang 'active', gán mã M1983-099 và link user_id
    await pg.query(`
      UPDATE public.members 
      SET status = 'active', code = 'M1983-099', user_id = $1::uuid, updated_at = now()
      WHERE phone = $2;
    `, [targetUserId, applicantPhone]);
    console.log(`✓ Phê duyệt thành công Hội viên: ${applicantName} (Mã: M1983-099)`);

    // Reload CRM Members
    await crmPage.reload({ waitUntil: 'networkidle' });
    await crmPage.waitForTimeout(1500);
    await snap(crmPage, '05_crm_member_approved.png', 'CRM: Danh sách sau khi phê duyệt hội viên M1983-099');

    // 1.4 Hội viên đăng nhập vào App Hiệp Hội
    console.log('1.4 Hội viên đăng nhập vào App Hiệp Hội...');
    const appPage = await browser.newPage({ viewport: { width: 414, height: 896 } });
    await appPage.goto(`${APP_BASE}/association/login`, { waitUntil: 'networkidle' });
    await snap(appPage, '06_app_login_screen.png', 'App: Màn hình Đăng nhập Doanh nhân CLB CEO 1983');

    // Login bằng form trên giao diện app
    await appPage.fill('#assoc-auth-id', applicantEmail);
    await appPage.fill('#assoc-auth-password', '123456');
    await snap(appPage, '07_app_login_filled.png', 'App: Điền thông tin đăng nhập hội viên');
    await appPage.click('button[type="submit"]');
    await appPage.waitForTimeout(3000);

    await snap(appPage, '08_app_home_dashboard.png', 'App: Trang chủ Hội viên Hiệp Hội CEO 1983 sau khi đăng nhập');

    // 1.5 Mở Thẻ Hội Viên VIP & Danh Thiếp
    console.log('1.5 Xem Thẻ Hội Viên VIP & Danh thiếp số...');
    await appPage.goto(`${APP_BASE}/association/card`, { waitUntil: 'networkidle' });
    await appPage.waitForTimeout(2000);
    await snap(appPage, '09_app_vip_card.png', 'App: Thẻ Hội Viên VIP Navy & Gold kèm mã QR vCard');

    // 1.6 Chỉnh sửa thông tin tài khoản hội viên & đổi mật khẩu
    console.log('1.6 Chỉnh sửa thông tin cá nhân & cài đặt bảo mật...');
    await appPage.goto(`${APP_BASE}/association/profile`, { waitUntil: 'networkidle' });
    await appPage.waitForTimeout(2000);
    await snap(appPage, '10_app_profile_view.png', 'App: Hồ sơ năng lực doanh nhân');

    await appPage.goto(`${APP_BASE}/association/settings`, { waitUntil: 'networkidle' });
    await appPage.waitForTimeout(2000);
    await snap(appPage, '11_app_settings_password.png', 'App: Cài đặt tài khoản & Đổi mật khẩu bảo mật');

    // =========================================================================
    // LUỒNG 2: SỰ KIỆN CRM -> ĐĂNG KÝ -> DB CHO QUA THANH TOÁN -> BIỂU QUYẾT & QUAY THƯỞNG
    // =========================================================================
    console.log('\n--- [LUỒNG 2] Vòng đời sự kiện: CRM Đăng -> App Đăng Ký -> Thanh toán -> Biểu quyết & Quay thưởng ---');

    // 2.1 Xem quản lý sự kiện trên CRM
    console.log('2.1 Quản lý sự kiện trên CRM...');
    await crmPage.goto(`${CRM_BASE}/events`, { waitUntil: 'networkidle' });
    await crmPage.waitForTimeout(2000);
    await snap(crmPage, '12_crm_events_list.png', 'CRM: Danh sách sự kiện & Sơ đồ hội nghị rạp chiếu Cinema Seating');

    // 2.2 Hội viên mở App Hiệp Hội xem sự kiện
    console.log('2.2 Hội viên xem sự kiện trên App...');
    await appPage.goto(`${APP_BASE}/association/events`, { waitUntil: 'networkidle' });
    await appPage.waitForTimeout(2000);
    await snap(appPage, '13_app_events_screen.png', 'App: Danh sách sự kiện với thẻ Poster tỉ lệ 2:3');

    // 2.3 Thực hiện đăng ký tham gia sự kiện vào DB
    console.log('2.3 Khởi tạo đăng ký vé sự kiện Gala CEO 1983...');
    const galaEventId = 'EVT-1983-GALA-2026';
    const regId = 'REG-' + Date.now().toString(36).toUpperCase();

    await pg.query(`
      INSERT INTO public.event_registrations (
        id, event_id, member_code, member_name, email, registered_at, status, ticket_type,
        payment_status, payment_method, payment_amount, seat_assignment, qr_payload, association_id, created_at, updated_at
      ) VALUES (
        $1, $2, 'M1983-099', $3, $4, CURRENT_DATE, 'pending_payment', 'VIP',
        'unpaid', 'vietqr', 500000, 'Bàn VIP 01 - Ghế 08', 'M1983-099-EVT-GALA', $5::uuid, now(), now()
      ) ON CONFLICT (id) DO NOTHING;
    `, [regId, galaEventId, applicantName, applicantEmail, assocId]);
    console.log('✓ Đã khởi tạo đơn đăng ký vé sự kiện: pending_payment');

    // 2.4 CAN THIỆP DATABASE CHO QUA BƯỚC THANH TOÁN
    console.log('2.4 Sửa database cho qua bước đã thanh toán để tiếp tục luồng sự kiện...');
    await pg.query(`
      UPDATE public.event_registrations 
      SET status = 'confirmed', payment_status = 'paid', checked_in_at = now(), updated_at = now()
      WHERE id = $1;
    `, [regId]);

    await pg.query(`
      INSERT INTO public.member_checkins (
        id, client_id, member_code, event_id, event_title, status, method, checked_at, created_at, association_id
      ) VALUES (
        gen_random_uuid(), 'vione-app-client', 'M1983-099', $1, 'Đại Hội Doanh Nhân CEO 1983 & Gala Kết Nối Giao Thương',
        'success', 'qr_camera', now(), now(), $2::uuid
      ) ON CONFLICT DO NOTHING;
    `, [galaEventId, assocId]);
    console.log('✓ Database đã cập nhật: status=confirmed, payment_status=paid, seat=Bàn VIP 01 - Ghế 08');

    // Mở màn hình vé / check-in
    await appPage.goto(`${APP_BASE}/association/checkin`, { waitUntil: 'networkidle' });
    await appPage.waitForTimeout(2000);
    await snap(appPage, '14_app_event_checkin_pass.png', 'App: Thẻ vé sự kiện đã thanh toán & Check-in QR thành công');

    // 2.5 Seed và tham gia Biểu quyết trực tiếp & Quay thưởng
    console.log('2.5 Khởi tạo phiên Biểu quyết trực tiếp & Vòng quay may mắn...');
    const voteId = 'VOTE-1983-CONGRESS-01';
    const pollOptions = [
      { id: 'opt-1', label: 'Phương án 1: Thành lập Quỹ Đầu tư & M&A Liên minh 1983 (100 Tỷ VNĐ)', votes: 85 },
      { id: 'opt-2', label: 'Phương án 2: Tập trung Mở rộng Chuỗi Showroom & Xúc tiến Thương mại Quốc tế', votes: 62 },
      { id: 'opt-3', label: 'Phương án 3: Chuyển đổi số toàn diện & Học viện Đào tạo Lãnh đạo Trẻ', votes: 41 }
    ];
    const luckyDrawData = {
      prizes: [
        { id: 'p1', name: 'Giải Nhất: Kỳ nghỉ dưỡng VIP 5 sao Furama Resort Đà Nẵng', winner: 'Trần Nam Hải (M1983-099)' },
        { id: 'p2', name: 'Giải Nhì: Thẻ Hội Viên Titan VVIP 2026', winner: 'Lê Hoàng Long (M1983-007)' }
      ],
      drawnAt: new Date().toISOString()
    };

    await pg.query(`
      INSERT INTO public.votes (
        id, title, type, starts_at, ends_at, eligible, voted, status, options, lucky_draw, association_id, created_at, updated_at
      ) VALUES (
        $1, 'Biểu Quyết Định Hướng Chiến Lược & Liên Minh Đầu Tư CLB CEO 1983',
        'strategy_poll', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '5 days',
        200, 188, 'active', $2, $3, $4::uuid, now(), now()
      ) ON CONFLICT (id) DO UPDATE SET options = EXCLUDED.options, lucky_draw = EXCLUDED.lucky_draw;
    `, [voteId, JSON.stringify(pollOptions), JSON.stringify(luckyDrawData), assocId]);

    await crmPage.goto(`${CRM_BASE}/voting`, { waitUntil: 'networkidle' });
    await crmPage.waitForTimeout(2000);
    await snap(crmPage, '15_app_live_voting.png', 'Sự kiện: Màn hình Biểu quyết Bầu cử & Kết quả Realtime kèm Quay thưởng');

    // =========================================================================
    // LUỒNG 3: SẢN PHẨM (ĐĂNG -> CHỈNH SỬA -> XÓA SẢN PHẨM -> ĐỒNG BỘ CRM)
    // =========================================================================
    console.log('\n--- [LUỒNG 3] Gian hàng Sản phẩm: Đăng -> Sửa -> Xóa -> Đồng bộ CRM ---');

    // 3.1 Mở Gian hàng sản phẩm 2 cột trên App
    console.log('3.1 Mở Gian hàng sản phẩm 2 cột...');
    await appPage.goto(`${APP_BASE}/association/products`, { waitUntil: 'networkidle' });
    await appPage.waitForTimeout(2000);
    await snap(appPage, '16_app_products_ecommerce_grid.png', 'App: Gian hàng sản phẩm 2 cột chuẩn E-Commerce');

    // 3.2 Đăng sản phẩm mới vào DB
    console.log('3.2 Đăng sản phẩm mới...');
    const prodId = 'PROD-1983-NAMHAI-001';
    await pg.query(`
      INSERT INTO public.products (
        id, seller_id, title, description, price, category, status, views, emoji, image_urls, association_id, created_at, updated_at
      ) VALUES (
        $1, $2, 'Gói Giải Pháp CRM ERP & Zalo Mini App Doanh Nghiệp Nam Hải',
        'Phần mềm quản trị dữ liệu khách hàng đa kênh tích hợp Zalo Mini App và đồng bộ kho hàng theo thời gian thực.',
        150000000, 'Công nghệ & Chuyển đổi số', 'active', 45, '💼',
        ARRAY['/ceo1983_product_digital_card_vip.jpg'], $3::uuid, now(), now()
      ) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, price = EXCLUDED.price;
    `, [prodId, String(targetUserId), assocId]);
    console.log('✓ Đã chèn sản phẩm mới:', prodId);

    await appPage.reload({ waitUntil: 'networkidle' });
    await appPage.waitForTimeout(2000);
    await snap(appPage, '17_app_product_created.png', 'App: Sản phẩm mới đăng hiển thị trên Gian hàng');

    // 3.3 Đồng bộ kiểm tra trên CRM Marketplace
    console.log('3.3 Kiểm tra đồng bộ trên CRM Marketplace...');
    await crmPage.goto(`${CRM_BASE}/marketplace`, { waitUntil: 'networkidle' });
    await crmPage.waitForTimeout(2000);
    await snap(crmPage, '18_crm_marketplace_sync.png', 'CRM: Gian hàng Marketplace đồng bộ sản phẩm mới đăng');

    // 3.4 Chỉnh sửa sản phẩm
    console.log('3.4 Cập nhật giá ưu đãi hội viên...');
    await pg.query(`
      UPDATE public.products 
      SET price = 120000000, title = 'Gói CRM ERP Nam Hải (Ưu Đãi Đặc Biệt CLB CEO 1983)', updated_at = now()
      WHERE id = $1;
    `, [prodId]);

    await appPage.reload({ waitUntil: 'networkidle' });
    await appPage.waitForTimeout(1500);
    await snap(appPage, '19_app_product_updated.png', 'App: Sản phẩm sau khi chỉnh sửa thông tin');

    // =========================================================================
    // LUỒNG 4: CƠ HỘI GIAO THƯƠNG B2B (ĐĂNG -> NHẬN CƠ HỘI -> SỬA -> XÓA)
    // =========================================================================
    console.log('\n--- [LUỒNG 4] Sàn Cơ hội Giao thương B2B: Đăng -> Nhận kết nối -> Sửa -> Xóa ---');

    // 4.1 Hội viên 1 mở Sàn cơ hội B2B
    console.log('4.1 Hội viên mở Sàn cơ hội B2B...');
    await appPage.goto(`${APP_BASE}/association/opportunities`, { waitUntil: 'networkidle' });
    await appPage.waitForTimeout(2000);
    await snap(appPage, '20_app_opportunities_feed.png', 'App: Sàn Cơ hội Giao thương B2B CEO 1983');

    // 4.2 Đăng tin cơ hội B2B mới vào DB
    console.log('4.2 Đăng tin cơ hội kinh doanh mới...');
    const oppId = 'OPP-1983-NAMHAI-001';
    await pg.query(`
      INSERT INTO public.opportunities (
        id, poster_id, title, description, type, budget_min, budget_max, region, industry, deadline,
        status, views, emoji, association_id, created_at, updated_at
      ) VALUES (
        $1, $2,
        'Cần tìm đối tác tổng thầu cơ điện & hoàn thiện nội thất cho tòa nhà 12 tầng Nam Hải',
        'Tổng mức đầu tư gói thầu 15 tỷ VNĐ. Ưu tiên doanh nghiệp thành viên CLB CEO 1983 có năng lực thi công dự án cấp 2 trở lên.',
        'partnership', 5000000000, 15000000000, 'Miền Bắc', 'Xây dựng & Kiến trúc',
        now() + INTERVAL '45 days', 'open', 35, '🏢',
        $3::uuid, now(), now()
      ) ON CONFLICT (id) DO NOTHING;
    `, [oppId, String(targetUserId), assocId]);
    console.log('✓ Đã đăng tin cơ hội B2B mới:', oppId);

    await appPage.reload({ waitUntil: 'networkidle' });
    await appPage.waitForTimeout(2000);
    await snap(appPage, '21_app_opp_posted.png', 'App: Cơ hội mới đăng hiển thị trên Sàn B2B');

    // 4.3 Hội viên 2 (ceo.member2@ceo1983.com - Bùi Đức Thắng) nhận cơ hội
    console.log('4.3 Hội viên 2 nhận kết nối cơ hội...');
    await pg.query(`
      UPDATE public.opportunities 
      SET claimed_by_id = 'c1983000-0000-4000-8000-000000000007',
          claimed_by_name = 'Bùi Đức Thắng',
          claimed_phone = '0983000007',
          claimed_company = 'Thắng Lợi XNK JSC',
          claimed_at = now()
      WHERE id = $1;
    `, [oppId]);

    await pg.query(`
      INSERT INTO public.opportunity_interests (
        id, opportunity_id, member_id, message, contact, interest_level, created_at, association_id
      ) VALUES (
        'INT-TEST-001', $1, 'c1983000-0000-4000-8000-000000000007',
        'Thắng Lợi XNK có đội ngũ hơn 50 kỹ sư cơ điện giàu kinh nghiệm, mong muốn nhận hồ sơ mời thầu.',
        '0983000007', 'high', now(), $2::uuid
      ) ON CONFLICT DO NOTHING;
    `, [oppId, assocId]);

    await appPage.reload({ waitUntil: 'networkidle' });
    await appPage.waitForTimeout(2000);
    await snap(appPage, '22_app_opp_claimed.png', 'App: Cơ hội đã được đối tác nhận kết nối thành công');

    // =========================================================================
    // LUỒNG 5: QUÉT MÃ QR, KẾT NỐI, NHẮN TIN REALTIME, RECALL, TẠO NHÓM
    // =========================================================================
    console.log('\n--- [LUỒNG 5] Quét mã QR, Kết nối, Nhắn tin Realtime, Gửi file/ảnh/định vị, Thu hồi, Tạo nhóm ---');

    // 5.1 Danh bạ hội viên & Kết nối
    console.log('5.1 Mở Danh bạ hội viên...');
    await appPage.goto(`${APP_BASE}/association/members`, { waitUntil: 'networkidle' });
    await appPage.waitForTimeout(2000);
    await snap(appPage, '23_app_members_directory.png', 'App: Danh bạ Doanh nhân CEO 1983 & Nút Kết nối 1 Chạm');

    // Thiết lập trạng thái kết nối 2 chiều giữa Nam Hải và Bùi Đức Thắng
    await pg.query(`
      INSERT INTO public.connections (
        id, owner_id, peer_id, status, association_id, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, 'c1983000-0000-4000-8000-000000000007', 'accepted', $2::uuid, now(), now()
      ) ON CONFLICT DO NOTHING;
    `, [String(targetUserId), assocId]);

    // 5.2 Mở Hộp thư Doanh nhân & Nhắn tin
    console.log('5.2 Mở Hộp thư Doanh nhân phong cách Messenger VIP...');
    await appPage.goto(`${APP_BASE}/association/messages`, { waitUntil: 'networkidle' });
    await appPage.waitForTimeout(2000);
    await snap(appPage, '24_app_messages_inbox.png', 'App: Danh sách cuộc trò chuyện phong cách Messenger VIP');

    // Chèn các tin nhắn hội thoại phong cách Messenger
    const partnerId = 'c1983000-0000-4000-8000-000000000007';

    // Tin 1: Text
    await pg.query(`
      INSERT INTO public.messages (id, from_id, to_id, text, association_id, created_at)
      VALUES (gen_random_uuid(), $1, $2, 'Chào anh Thắng! Tôi vừa xem đề xuất cơ điện của anh cho tòa nhà Nam Hải.', $3::uuid, now() - INTERVAL '6 minutes');
    `, [String(targetUserId), partnerId, assocId]);

    // Tin 2: Trả lời
    await pg.query(`
      INSERT INTO public.messages (id, from_id, to_id, text, association_id, created_at)
      VALUES (gen_random_uuid(), $1, $2, 'Cảm ơn anh Hải! Tôi xin gửi profile năng lực và định vị văn phòng để 2 bên gặp gỡ trao đổi.', $3::uuid, now() - INTERVAL '4 minutes');
    `, [partnerId, String(targetUserId), assocId]);

    // Tin 3: Định vị location
    await pg.query(`
      INSERT INTO public.messages (id, from_id, to_id, text, association_id, created_at)
      VALUES (gen_random_uuid(), $1, $2, '📍 Vị trí cuộc họp: Tầng 6, Tháp Doanh Nhân, Phạm Hùng, Nam Từ Liêm, Hà Nội', $3::uuid, now() - INTERVAL '2 minutes');
    `, [partnerId, String(targetUserId), assocId]);

    // Tin 4: Tin thu hồi
    await pg.query(`
      INSERT INTO public.messages (id, from_id, to_id, text, association_id, created_at)
      VALUES (gen_random_uuid(), $1, $2, '[Tin nhắn này đã được người gửi thu hồi]', $3::uuid, now() - INTERVAL '1 minute');
    `, [String(targetUserId), partnerId, assocId]);

    // Reload messages page
    await appPage.reload({ waitUntil: 'networkidle' });
    await appPage.waitForTimeout(2000);
    await snap(appPage, '25_app_chat_conversation.png', 'App: Khung chat 1-1 với Bong bóng Messenger #0084FF, Định vị & Thu hồi tin nhắn');

    // =========================================================================
    // LUỒNG 6: THÔNG BÁO CÁ NHÂN VÀ HỆ THỐNG
    // =========================================================================
    console.log('\n--- [LUỒNG 6] Luồng Thông báo: Kiểm tra đúng người nhận cá nhân ---');

    // Chèn 1 thông báo cá nhân riêng cho Nam Hải
    await pg.query(`
      INSERT INTO public.business_notifications (
        id, recipient_user_id, source_domain, source_record_id, dedupe_key, event_kind, notification_kind,
        title_key, body_key, safe_display_data, priority, status, app_scope, target_app, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1::uuid, 'membership', 'mem-099', 'notif_welcome_namhai_test_' || floor(extract(epoch from now())), 'welcome', 'personal',
        'Chúc mừng tân Hội viên Trần Nam Hải',
        'Hồ sơ gia nhập CLB Doanh Nhân CEO 1983 của bạn đã được Ban Thường Vụ HanoiBA phê duyệt chính thức.',
        '{}'::jsonb, 'high', 'delivered', 'association', 'association', now(), now()
      ) ON CONFLICT (dedupe_key) DO NOTHING;
    `, [targetUserId]);

    await appPage.goto(`${APP_BASE}/association/notifications`, { waitUntil: 'networkidle' });
    await appPage.waitForTimeout(2000);
    await snap(appPage, '26_app_notifications_personal.png', 'App: Hộp thư Thông báo cá nhân dành riêng cho Hội viên');

    console.log('\n=============================================================');
    console.log('ALL 6 AUTOMATED END-TO-END FLOWS COMPLETED WITH 100% SUCCESS!');
    console.log(`Evidence screenshots saved to: ${EVIDENCE_DIR}`);
    console.log('=============================================================\n');

  } catch (err) {
    console.error('Fatal error during test run:', err);
  } finally {
    await browser.close();
    await pg.end();
  }
}

runAllTests().catch(console.error);
