const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const EVIDENCE_DIR = path.join(__dirname, '../document/images/evidence');
const BASE_URL = 'https://14.225.217.232:5445';
const API_URL = `${BASE_URL}/api`;

async function snap(page, filename, desc) {
  const filePath = path.join(EVIDENCE_DIR, filename);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`[EXTRA CAPTURE] ${filename} -> ${desc}`);
}

async function loginViaApi() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@connect.vn', password: '123456' })
  });
  return await res.json();
}

async function injectAuth(page, authData) {
  const token = authData.access_token;
  const refreshToken = authData.refresh_token || token;
  const user = authData.user || { email: 'admin@connect.vn', role: 'admin' };

  await page.evaluate(({ token, refreshToken, user }) => {
    localStorage.setItem('vibe_token', token);
    localStorage.setItem('vibe_refresh_token', refreshToken);
    localStorage.setItem('vba_user', JSON.stringify(user));
    localStorage.setItem('user', JSON.stringify(user));
    document.cookie = `sb-access-token=${token}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `vibe_token=${token}; path=/; max-age=86400; SameSite=Lax`;
  }, { token, refreshToken, user });
}

async function run() {
  const authData = await loginViaApi();
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--ignore-certificate-errors', '--no-sandbox']
  });

  // Desktop context
  const contextDesktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true
  });
  const pageDesktop = await contextDesktop.newPage();
  await pageDesktop.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
  await injectAuth(pageDesktop, authData);

  // 1. Member Drawer on CRM
  console.log('Capture CRM Member Drawer...');
  await pageDesktop.goto(`${BASE_URL}/members`, { waitUntil: 'networkidle' });
  await pageDesktop.waitForTimeout(2000);
  const memberRow = await pageDesktop.$('table tr:nth-child(2), div[role="button"], button:has-text("Chi tiết")');
  if (memberRow) {
    await memberRow.click().catch(() => {});
    await pageDesktop.waitForTimeout(1000);
  }
  await snap(pageDesktop, 'vione_crm_04_member_detail_drawer.png', 'CRM: Chi tiết Hồ sơ Hội viên & Phê duyệt');

  // 2. Event Create Modal on CRM
  console.log('Capture CRM Event Create...');
  await pageDesktop.goto(`${BASE_URL}/events`, { waitUntil: 'networkidle' });
  await pageDesktop.waitForTimeout(2000);
  const createEvtBtn = await pageDesktop.$('button:has-text("Tạo sự kiện"), button:has-text("Thêm sự kiện")');
  if (createEvtBtn) {
    await createEvtBtn.click().catch(() => {});
    await pageDesktop.waitForTimeout(1000);
  }
  await snap(pageDesktop, 'vione_crm_08_event_create_modal.png', 'CRM: Khởi tạo Sự kiện & Thiết lập Sơ đồ Chỗ ngồi Cinema');

  // 3. Workflow Create Task on CRM
  console.log('Capture CRM Workflow Task Create...');
  await pageDesktop.goto(`${BASE_URL}/workflow`, { waitUntil: 'networkidle' });
  await pageDesktop.waitForTimeout(2000);
  const createTaskBtn = await pageDesktop.$('button:has-text("Tạo công việc"), button:has-text("Thêm công việc")');
  if (createTaskBtn) {
    await createTaskBtn.click().catch(() => {});
    await pageDesktop.waitForTimeout(1000);
  }
  await snap(pageDesktop, 'vione_crm_10b_task_create_modal.png', 'CRM: Form Khởi tạo Task BPMN & Checklist Nghiệm thu');

  // 4. Payment Approval Create Proposal on CRM
  console.log('Capture CRM Approval Create...');
  await pageDesktop.goto(`${BASE_URL}/payment-approvals`, { waitUntil: 'networkidle' });
  await pageDesktop.waitForTimeout(2000);
  const createPropBtn = await pageDesktop.$('button:has-text("Tạo tờ trình"), button:has-text("Tạo đề xuất")');
  if (createPropBtn) {
    await createPropBtn.click().catch(() => {});
    await pageDesktop.waitForTimeout(1000);
  }
  await snap(pageDesktop, 'vione_crm_13b_approval_create_modal.png', 'CRM: Form Tạo Tờ trình Chi 3 cấp & VietQR 24/7');

  // Mobile App context
  const contextMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
    ignoreHTTPSErrors: true
  });
  const pageMobile = await contextMobile.newPage();
  await pageMobile.goto(`${BASE_URL}/connect-app`, { waitUntil: 'networkidle' });
  await injectAuth(pageMobile, authData);
  await pageMobile.goto(`${BASE_URL}/connect-app`, { waitUntil: 'networkidle' });
  await pageMobile.waitForTimeout(2000);

  // 5. Quick Action V Sheet on Mobile
  console.log('Capture App V-Action Sheet...');
  const vBtn = await pageMobile.$('button[aria-label="V-Action"], div[role="button"]:has-text("V"), div.vione-v-button');
  if (vBtn) {
    await vBtn.click().catch(() => {});
    await pageMobile.waitForTimeout(1000);
  }
  await snap(pageMobile, 'vione_app_03_quick_action_v.png', 'App: Menu Lối tắt Thao tác Nhanh V-Action');

  // 6. App Chat Thread
  console.log('Capture App Chat Thread...');
  await pageMobile.goto(`${BASE_URL}/connect-app/inbox`, { waitUntil: 'networkidle' });
  await pageMobile.waitForTimeout(2000);
  const threadItem = await pageMobile.$('div[role="button"], div.thread-item, div:has-text("Tin nhắn")');
  if (threadItem) {
    await threadItem.click().catch(() => {});
    await pageMobile.waitForTimeout(1000);
  }
  await snap(pageMobile, 'vione_app_13_chat_thread.png', 'App: Khung Chat Trực tiếp 1-1 & Trao đổi Nhóm B2B');

  // 7. App NFC Radar Modal
  console.log('Capture App NFC Radar...');
  await pageMobile.goto(`${BASE_URL}/connect-app/card`, { waitUntil: 'networkidle' });
  await pageMobile.waitForTimeout(2000);
  const nfcBtn = await pageMobile.$('button:has-text("NFC"), button:has-text("Chạm thẻ"), button:has-text("Chia sẻ")');
  if (nfcBtn) {
    await nfcBtn.click().catch(() => {});
    await pageMobile.waitForTimeout(1000);
  }
  await snap(pageMobile, 'vione_app_15_nfc_qr_share.png', 'App: Chạm Thẻ Danh Thiếp NFC & Quét QR Trao Đổi Đối Tác');

  await browser.close();
  console.log('=== EXTRA CAPTURE COMPLETE ===');
}

run().catch(err => console.error(err));
