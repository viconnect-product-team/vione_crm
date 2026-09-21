const { chromium } = require('playwright');
const path = require('path');

async function testMemberDrawer() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://14.225.217.232:5000/auth', { waitUntil: 'networkidle', timeout: 20000 });
  await page.locator('input[type="email"], input[name="email"], input[placeholder*="email"], input[type="text"]').first().fill('admin@connect.vn');
  await page.locator('input[type="password"]').first().fill('123456');
  await page.locator('button:has-text("Đăng nhập")').first().click();
  await page.waitForTimeout(3000);

  // Go to /members
  await page.goto('http://14.225.217.232:5000/members', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);

  // Click the first "Xem" button
  const xemBtn = page.locator('button:has-text("Xem")').first();
  console.log('Xem button count:', await xemBtn.count());
  if (await xemBtn.count() > 0) {
    await xemBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(__dirname, 'test_crm_member_detail_open.png') });
  }

  // Also test table view "Dạng bảng"
  await page.goto('http://14.225.217.232:5000/members', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1000);
  const tableBtn = page.locator('button:has-text("Dạng bảng")').first();
  if (await tableBtn.count() > 0) {
    await tableBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(__dirname, 'test_crm_members_table_view.png') });
  }

  // Also test Lucky Draw modal in /voting
  await page.goto('http://14.225.217.232:5000/voting', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1500);
  const luckyBtn = page.locator('button:has-text("Bốc Thăm"), button:has-text("Trúng Thưởng")').first();
  if (await luckyBtn.count() > 0) {
    await luckyBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(__dirname, 'test_crm_lucky_draw_modal.png') });
  }

  await browser.close();
}

testMemberDrawer().catch(console.error);
