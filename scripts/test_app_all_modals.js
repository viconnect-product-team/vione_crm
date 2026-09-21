const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const APP_BASE = 'http://14.225.217.232:5002';
const OUT_DIR = path.join(__dirname, 'app_captures_v2');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  console.log('Logging into App...');
  await page.goto(`${APP_BASE}/association/login`, { waitUntil: 'networkidle' });
  await page.locator('#assoc-auth-id').fill('ceo.tongthuky@ceo1983.com');
  await page.locator('#assoc-auth-password').fill('123456');
  await page.locator('form button[type="submit"]').click();
  await page.waitForTimeout(3000);
  console.log('App logged in URL:', page.url());

  // 1. Events -> Event detail modal -> Register
  console.log('Testing Events Detail...');
  await page.goto(`${APP_BASE}/association/events`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const detailBtn = page.locator('button:has-text("Xem chi tiết")').first();
  if (await detailBtn.count() > 0) {
    await detailBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT_DIR, 'event_detail_modal.png') });
    console.log('Captured event_detail_modal.png');

    // Check for register button inside modal
    const regBtn = page.locator('button:has-text("Đăng ký"), button:has-text("Nhận vé")').first();
    if (await regBtn.count() > 0) {
      await regBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(OUT_DIR, 'event_vietqr_payment.png') });
      console.log('Captured event_vietqr_payment.png');
    }
  }

  // 2. Members -> Profile modal & Invite modal
  console.log('Testing Members...');
  await page.goto(`${APP_BASE}/association/members`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Invite button
  const inviteBtn = page.locator('button:has-text("Mời"), button:has-text("+ Mời")').first();
  if (await inviteBtn.count() > 0) {
    await inviteBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT_DIR, 'member_invite_modal.png') });
    console.log('Captured member_invite_modal.png');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Member profile click
  await page.goto(`${APP_BASE}/association/members`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const memberRow = page.locator('.cursor-pointer:has(img), div[role="button"]:has(img)').first();
  if (await memberRow.count() > 0) {
    await memberRow.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT_DIR, 'member_profile_modal.png') });
    console.log('Captured member_profile_modal.png');
  }

  // 3. Messages -> Create group & Chat 1-1 & Expander & Call
  console.log('Testing Messages...');
  await page.goto(`${APP_BASE}/association/messages`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, 'messages_inbox.png') });

  // Create group button
  const addGroupBtn = page.locator('button:has-text("+"), button[aria-label*="nhóm"], button[title*="nhóm"]').first();
  if (await addGroupBtn.count() > 0) {
    await addGroupBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT_DIR, 'create_group_modal.png') });
    console.log('Captured create_group_modal.png');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Click first conversation
  await page.goto(`${APP_BASE}/association/messages`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const conv = page.locator('.cursor-pointer, [role="button"]').first();
  if (await conv.count() > 0) {
    await conv.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT_DIR, 'chat_conversation.png') });
    console.log('Captured chat_conversation.png');

    // Click "+" tool expander in chat
    const expandBtn = page.locator('button:has-text("+"), button[aria-label*="đính kèm"], button[aria-label*="mở rộng"]').first();
    if (await expandBtn.count() > 0) {
      await expandBtn.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(OUT_DIR, 'chat_expander.png') });
      console.log('Captured chat_expander.png');
    }

    // Click Call button in chat header
    const callBtn = page.locator('button:has-text("Gọi"), button[aria-label*="gọi"], button:has(svg.lucide-phone)').first();
    if (await callBtn.count() > 0) {
      await callBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(OUT_DIR, 'chat_call_popup.png') });
      console.log('Captured chat_call_popup.png');
    }
  }

  // 4. Profile menu -> User Guide
  console.log('Testing Profile & User Guide...');
  await page.goto(`${APP_BASE}/association/profile`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, 'profile_menu.png') });

  const guideBtn = page.locator('text="Hướng dẫn sử dụng"').first();
  if (await guideBtn.count() > 0) {
    await guideBtn.click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(OUT_DIR, 'user_guide_viewer.png') });
    console.log('Captured user_guide_viewer.png');
  }

  await browser.close();
}

run().catch(console.error);
