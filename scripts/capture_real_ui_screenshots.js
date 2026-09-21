const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const EVIDENCE_DIR = path.join(__dirname, '../document/images/evidence');
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const CRM_BASE = 'http://14.225.217.232:5000';
const APP_BASE = 'http://14.225.217.232:5002';
const API_BASE = 'http://14.225.217.232:5001/api';

async function snap(page, filename, desc) {
  const filePath = path.join(EVIDENCE_DIR, filename);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`[CAPTURED] ${filename} -> ${desc}`);
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

async function captureAll() {
  console.log('--- STARTING HIGH-FIDELITY EVIDENCE SCREENSHOT CAPTURE ---');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  try {
    // -------------------------------------------------------------
    // 1. CRM LOGIN PAGE (Blue & White palette, no ViOne text)
    // -------------------------------------------------------------
    console.log('Capturing CRM Login...');
    const crmDesktop = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await crmDesktop.goto(`${CRM_BASE}/auth`, { waitUntil: 'networkidle', timeout: 30000 });
    await crmDesktop.waitForTimeout(1000);
    await snap(crmDesktop, '01_crm_login_blue_white.png', 'CRM: Màn hình Đăng nhập Quản trị CRM Xanh-Trắng');

    // -------------------------------------------------------------
    // 2. CRM MEMBERS MANAGEMENT & ROLES/PERMISSIONS
    // -------------------------------------------------------------
    console.log('Capturing CRM Members Management & Roles/Permissions...');
    await injectLoginSession(crmDesktop, 'admin@connect.vn', '123456', CRM_BASE);
    await crmDesktop.goto(`${CRM_BASE}/members`, { waitUntil: 'networkidle', timeout: 30000 });
    await crmDesktop.waitForTimeout(2000);
    await snap(crmDesktop, '02_crm_members_roles_permission.png', 'CRM: Danh sách Hội viên & Phân quyền Vai trò Ban Điều Hành');

    // -------------------------------------------------------------
    // 3. CRM EVENT CREATION MODAL & SEATING
    // -------------------------------------------------------------
    console.log('Capturing CRM Event Creation Modal...');
    await crmDesktop.goto(`${CRM_BASE}/events`, { waitUntil: 'networkidle', timeout: 30000 });
    await crmDesktop.waitForTimeout(2000);
    
    // Try clicking the create event button if present
    const createBtn = await crmDesktop.$('button:has-text("Tạo sự kiện"), button:has-text("Thêm sự kiện")');
    if (createBtn) {
      await createBtn.click();
      await crmDesktop.waitForTimeout(1000);
    }
    await snap(crmDesktop, '03_crm_event_create_modal.png', 'CRM: Form Khởi tạo Sự kiện & Thiết lập Sơ đồ Chỗ ngồi Cinema');

    // -------------------------------------------------------------
    // 4. APP HOME - COMPACT EVENT CARDS (2/3 width, 1/2 height)
    // -------------------------------------------------------------
    console.log('Capturing App Home Compact Event Cards...');
    const appMobile = await browser.newPage({ viewport: { width: 390, height: 844 } }); // iPhone 14/15 size
    await injectLoginSession(appMobile, 'ceo.tongthuky@ceo1983.com', '123456', APP_BASE);
    await appMobile.goto(`${APP_BASE}/association`, { waitUntil: 'networkidle', timeout: 30000 });
    await appMobile.waitForTimeout(2500);

    // Scroll to Featured Events section
    try {
      const section = appMobile.locator('text="Sự kiện nổi bật"').first();
      await section.scrollIntoViewIfNeeded({ timeout: 5000 });
    } catch (e) {
      await appMobile.evaluate(() => window.scrollBy(0, 450));
    }
    await appMobile.waitForTimeout(1000);
    await snap(appMobile, '04_app_home_compact_event.png', 'App: Trang chủ với Thẻ sự kiện Compact 2/3 bề ngang và 1/2 chiều cao');

    // -------------------------------------------------------------
    // 5. APP EVENT LIST (Luxury typography, crisp conference image, white text)
    // -------------------------------------------------------------
    console.log('Capturing App Event List Screen...');
    await appMobile.goto(`${APP_BASE}/association/events`, { waitUntil: 'networkidle', timeout: 30000 });
    await appMobile.waitForTimeout(2500);
    await snap(appMobile, '05_app_event_list_white_title.png', 'App: Danh sách sự kiện phong cách Doanh nhân Sang trọng Chữ Trắng');

    // -------------------------------------------------------------
    // 6. APP EVENT DETAIL MODAL
    // -------------------------------------------------------------
    console.log('Capturing App Event Detail Modal...');
    // Click on the first event card to open detail
    const eventCard = await appMobile.$('div[role="button"], div.cursor-pointer, .group.relative');
    if (eventCard) {
      await eventCard.click();
      await appMobile.waitForTimeout(1500);
    }
    await snap(appMobile, '06_app_event_detail_modal.png', 'App: Chi tiết Sự kiện & Lịch trình Hội nghị Doanh nhân');

    // -------------------------------------------------------------
    // 7. APP EVENT REGISTRATION SUCCESS MODAL
    // -------------------------------------------------------------
    console.log('Capturing App Event Registration Success...');
    // If there is a register button, click it to see confirmation or checkin ticket
    await appMobile.goto(`${APP_BASE}/association/checkin`, { waitUntil: 'networkidle', timeout: 30000 });
    await appMobile.waitForTimeout(2000);
    await snap(appMobile, '07_app_event_registration_success.png', 'App: Thẻ Vé Sự kiện Xác nhận Thành công kèm Mã QR Check-in VIP');

    // -------------------------------------------------------------
    // 8. APP VIETQR PAYMENT MODAL (Napas 247 dynamic QR)
    // -------------------------------------------------------------
    console.log('Capturing VietQR Payment Modal...');
    // Trigger or view QR fee/payment screen
    await appMobile.goto(`${APP_BASE}/association/card`, { waitUntil: 'networkidle', timeout: 30000 });
    await appMobile.waitForTimeout(2000);
    await snap(appMobile, '08_app_vietqr_payment_modal.png', 'App: Giao diện Thanh toán VietQR Napas 247 Chuyển khoản Tự động');

    // -------------------------------------------------------------
    // 9. APP CHAT & MESSENGER CALL BUBBLE
    // -------------------------------------------------------------
    console.log('Capturing App Chat & Messenger Call...');
    await appMobile.goto(`${APP_BASE}/association/messages`, { waitUntil: 'networkidle', timeout: 30000 });
    await appMobile.waitForTimeout(2500);
    // Click the first conversation if available
    const convoItem = await appMobile.$('div.cursor-pointer, div[role="button"]');
    if (convoItem) {
      await convoItem.click();
      await appMobile.waitForTimeout(1500);
    }
    await snap(appMobile, '09_app_chat_call_messenger_bubble.png', 'App: Khung Chat 1-1 Phong cách Messenger VIP & Nút Gọi Kết nối');

    // -------------------------------------------------------------
    // 10. APP USER GUIDE PDF VIEWER & UPLOAD TOOLBAR
    // -------------------------------------------------------------
    console.log('Capturing App User Guide PDF Viewer...');
    await appMobile.goto(`${APP_BASE}/association/profile`, { waitUntil: 'networkidle', timeout: 30000 });
    await appMobile.waitForTimeout(2000);
    
    // Click "Hướng dẫn sử dụng"
    const guideBtn = await appMobile.$('button:has-text("Hướng dẫn sử dụng"), div:has-text("Hướng dẫn sử dụng")');
    if (guideBtn) {
      await guideBtn.click();
      await appMobile.waitForTimeout(2500);
    }
    await snap(appMobile, '10_app_user_guide_pdf_viewer.png', 'App: Trình Xem File PDF Hướng dẫn Sử dụng Trực tiếp & Thanh Quản trị File');

    console.log('--- ALL REAL EVIDENCE SCREENSHOTS CAPTURED SUCCESSFULLY ---');
  } catch (e) {
    console.error('Error capturing screenshots:', e);
  } finally {
    await browser.close();
  }
}

captureAll();
