const { chromium } = require('playwright');
const path = require('path');

async function testLandingModals() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://14.225.217.232:5002/landing/ceo1983', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Click Join button
  const joinBtn = page.locator('button:has-text("ĐĂNG KÝ GIA NHẬP"), a:has-text("ĐĂNG KÝ GIA NHẬP"), button:has-text("GIA NHẬP VIP")').first();
  console.log('Join btn count:', await joinBtn.count());
  if (await joinBtn.count() > 0) {
    await joinBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(__dirname, 'test_landing_reg_modal.png') });
    // Close modal
    const closeBtn = page.locator('button[aria-label="Close"], button:has-text("Đóng"), button:has-text("✕")').first();
    if (await closeBtn.count() > 0) await closeBtn.click();
    else await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Click Tra cứu tiến độ
  const statusBtn = page.locator('button:has-text("Tra Cứu"), button:has-text("Tra cứu")').first();
  console.log('Status btn count:', await statusBtn.count());
  if (await statusBtn.count() > 0) {
    await statusBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(__dirname, 'test_landing_status_modal.png') });
  }

  await browser.close();
}

testLandingModals().catch(console.error);
