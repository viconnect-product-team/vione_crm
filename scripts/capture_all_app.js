const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const APP_BASE = 'http://14.225.217.232:5002';
const OUT_DIR = path.join(__dirname, 'app_captures');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function captureApp() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  console.log('1. App Login screen...');
  await page.goto(`${APP_BASE}/association/login`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.screenshot({ path: path.join(OUT_DIR, '01_app_login.png') });

  // Fill credentials and capture filled
  await page.locator('#assoc-auth-id').fill('ceo.tongthuky@ceo1983.com');
  await page.locator('#assoc-auth-password').fill('123456');
  await page.screenshot({ path: path.join(OUT_DIR, '01b_app_login_filled.png') });

  // Submit
  await page.locator('form button[type="submit"]').click();
  await page.waitForTimeout(4000);
  console.log('2. App Home URL:', page.url());
  await page.screenshot({ path: path.join(OUT_DIR, '02_app_home.png') });

  // Scroll down home to capture compact events
  await page.evaluate(() => window.scrollBy(0, 300));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '02b_app_home_scroll.png') });

  // 3. Card Screen
  console.log('3. App VIP Card...');
  await page.goto(`${APP_BASE}/association/card`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '03_app_vip_card.png') });

  // Try clicking NFC / QR / VietQR in card
  const nfcBtn = page.locator('button:has-text("NFC"), button:has-text("Chạm thẻ"), button:has-text("Radar")').first();
  if (await nfcBtn.count() > 0) {
    await nfcBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, '03b_app_nfc_modal.png') });
    const closeBtn = page.locator('button:has-text("Đóng"), button[aria-label="Close"]').first();
    if (await closeBtn.count() > 0) await closeBtn.click();
  }

  // 4. Events Screen
  console.log('4. App Events Screen...');
  await page.goto(`${APP_BASE}/association/events`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '04_app_events.png') });

  // Open first event detail
  const eventCard = page.locator('.cursor-pointer, [role="button"], div[class*="rounded"]:has(h3)').first();
  if (await eventCard.count() > 0) {
    await eventCard.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT_DIR, '04b_app_event_detail.png') });
    const closeBtn = page.locator('button:has-text("Đóng"), button[aria-label="Close"], button:has-text("Quay lại")').first();
    if (await closeBtn.count() > 0) await closeBtn.click();
  }

  // 5. Checkin / Ticket Pass
  console.log('5. App Checkin / Ticket Pass...');
  await page.goto(`${APP_BASE}/association/checkin`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '05_app_ticket_pass.png') });

  // 6. Products / Marketplace
  console.log('6. App Marketplace...');
  await page.goto(`${APP_BASE}/association/products`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '06_app_products.png') });

  // Click create product button if present
  const addProdBtn = page.locator('button:has-text("Đăng sản phẩm"), button:has-text("Thêm sản phẩm"), button:has-text("Tạo sản phẩm")').first();
  if (await addProdBtn.count() > 0) {
    await addProdBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, '06b_app_product_create_modal.png') });
    const closeBtn = page.locator('button:has-text("Hủy"), button[aria-label="Close"], button:has-text("Đóng")').first();
    if (await closeBtn.count() > 0) await closeBtn.click();
  }

  // Click first product card
  const prodCard = page.locator('.cursor-pointer, [role="button"]').first();
  if (await prodCard.count() > 0) {
    await prodCard.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, '06c_app_product_detail.png') });
    const closeBtn = page.locator('button:has-text("Đóng"), button[aria-label="Close"]').first();
    if (await closeBtn.count() > 0) await closeBtn.click();
  }

  // 7. Opportunities
  console.log('7. App Opportunities...');
  await page.goto(`${APP_BASE}/association/opportunities`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '07_app_opportunities.png') });

  // Create opportunity button
  const addOppBtn = page.locator('button:has-text("Tạo"), button:has-text("Đăng"), button:has-text("Chia sẻ")').first();
  if (await addOppBtn.count() > 0) {
    await addOppBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, '07b_app_opp_create_modal.png') });
    const closeBtn = page.locator('button:has-text("Hủy"), button[aria-label="Close"]').first();
    if (await closeBtn.count() > 0) await closeBtn.click();
  }

  // Click first opportunity card
  const oppCard = page.locator('.cursor-pointer, [role="button"]').first();
  if (await oppCard.count() > 0) {
    await oppCard.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, '07c_app_opp_detail.png') });
    const closeBtn = page.locator('button:has-text("Đóng"), button[aria-label="Close"]').first();
    if (await closeBtn.count() > 0) await closeBtn.click();
  }

  // 8. Members Directory
  console.log('8. App Members Directory...');
  await page.goto(`${APP_BASE}/association/members`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '08_app_members.png') });

  // Click first member in directory
  const memCard = page.locator('.cursor-pointer, button:has-text("Xem"), [role="button"]').first();
  if (await memCard.count() > 0) {
    await memCard.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, '08b_app_member_profile.png') });
    const closeBtn = page.locator('button:has-text("Đóng"), button[aria-label="Close"]').first();
    if (await closeBtn.count() > 0) await closeBtn.click();
  }

  // 9. Messages
  console.log('9. App Messages...');
  await page.goto(`${APP_BASE}/association/messages`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '09_app_messages.png') });

  // Click first conversation
  const chatItem = page.locator('.cursor-pointer, [role="button"]').first();
  if (await chatItem.count() > 0) {
    await chatItem.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT_DIR, '09b_app_chat_thread.png') });
  }

  // 10. Profile Menu
  console.log('10. App Profile Menu...');
  await page.goto(`${APP_BASE}/association/profile`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '10_app_profile.png') });

  // Try clicking Hướng dẫn sử dụng
  const guideBtn = page.locator('button:has-text("Hướng dẫn sử dụng"), div:has-text("Hướng dẫn sử dụng"), a:has-text("Hướng dẫn sử dụng")').first();
  if (await guideBtn.count() > 0) {
    await guideBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT_DIR, '10b_app_user_guide.png') });
    const closeBtn = page.locator('button:has-text("Đóng"), button[aria-label="Close"]').first();
    if (await closeBtn.count() > 0) await closeBtn.click();
  }

  // 11. Settings
  console.log('11. App Settings...');
  await page.goto(`${APP_BASE}/association/settings`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '11_app_settings.png') });

  // 12. Notifications
  console.log('12. App Notifications...');
  await page.goto(`${APP_BASE}/association/notifications`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '12_app_notifications.png') });

  // 13. News
  console.log('13. App News...');
  await page.goto(`${APP_BASE}/association/news`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '13_app_news.png') });

  console.log('All App captures finished!');
  await browser.close();
}

captureApp().catch(console.error);
