const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const undici = require('undici');

const EVIDENCE_DIR = path.join(__dirname, '../document/images/evidence');
const FE_EVIDENCE_DIR = path.join(__dirname, '../apps/vione_app_fe/public/docs/images/evidence');
const APP_URL = 'https://14.225.217.232:5444';

async function snap(page, filename, desc) {
  const filePath = path.join(EVIDENCE_DIR, filename);
  const feFilePath = path.join(FE_EVIDENCE_DIR, filename);
  await page.screenshot({ path: filePath, fullPage: false });
  fs.copyFileSync(filePath, feFilePath);
  const stat = fs.statSync(filePath);
  console.log(`[SNAPSHOT] Saved: ${filename.padEnd(38)} (${(stat.size / 1024).toFixed(1)} KB) | ${desc}`);
}

async function run() {
  const appLoginResp = await fetch(`${APP_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'vumikasa6@gmail.com', password: 'Password1983!' }),
    dispatcher: new undici.Agent({ connect: { rejectUnauthorized: false } })
  });
  const appAuth = await appLoginResp.json();

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    ignoreHTTPSErrors: true,
    locale: 'vi-VN',
  });

  await mobileContext.addCookies([
    { name: 'sb-access-token', value: appAuth.access_token, domain: '14.225.217.232', path: '/', secure: true, sameSite: 'Lax' },
    { name: 'sb-refresh-token', value: appAuth.refresh_token || appAuth.access_token, domain: '14.225.217.232', path: '/', secure: true, sameSite: 'Lax' },
  ]);

  const appPage = await mobileContext.newPage();
  await appPage.goto(`${APP_URL}/association`, { waitUntil: 'domcontentloaded' });
  await appPage.evaluate(({ appAuth }) => {
    localStorage.setItem('vibe_token', appAuth.access_token);
    localStorage.setItem('vibe_refresh_token', appAuth.refresh_token || appAuth.access_token);
    localStorage.setItem('vba_user', JSON.stringify(appAuth.user));
  }, { appAuth });

  // 1. Recapture Member Profile Modal
  console.log('1. Recapturing Member Profile Modal...');
  await appPage.goto(`${APP_URL}/association/members`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await appPage.waitForTimeout(2000);

  // Click on the member card text or avatar to trigger modal
  try {
    const memberName = await appPage.locator('[role="listitem"] button').first();
    if (await memberName.count() > 0) {
      await memberName.click({ timeout: 5000 });
      await appPage.waitForTimeout(2000);
      await snap(appPage, 'app_step_08_member_profile_modal.png', 'Drawer/Modal Chi Tiết Hồ Sơ Năng Lực Hội Viên Đối Tác');
    }
  } catch (e) {
    console.log('  Error member modal:', e.message);
  }

  // 2. Recapture Product Detail / Quote Modal
  console.log('2. Recapturing Product Detail Modal...');
  await appPage.goto(`${APP_URL}/association/products`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await appPage.waitForTimeout(2000);

  try {
    const quoteBtn = appPage.locator('button:has-text("Báo giá"), button:has-text("Yêu cầu"), button:has-text("Nhận báo giá"), button:has-text("Chi tiết")').first();
    if (await quoteBtn.count() > 0) {
      await quoteBtn.click({ timeout: 5000 });
      await appPage.waitForTimeout(2000);
      await snap(appPage, 'app_step_17_product_detail_modal.png', 'Modal Chi Tiết Yêu Cầu Báo Giá Sản Phẩm Ưu Đãi VIP');
    } else {
      // Click first product card
      const prodCard = appPage.locator('img[alt]').first();
      await prodCard.click({ timeout: 5000 });
      await appPage.waitForTimeout(2000);
      await snap(appPage, 'app_step_17_product_detail_modal.png', 'Modal Chi Tiết Yêu Cầu Báo Giá Sản Phẩm Ưu Đãi VIP');
    }
  } catch (e) {
    console.log('  Error product detail:', e.message);
  }

  await appPage.close();
  await mobileContext.close();
  await browser.close();
  console.log('Recapture completed!');
}

run().catch(console.error);
