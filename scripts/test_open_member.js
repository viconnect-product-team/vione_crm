const { chromium } = require('playwright');
const path = require('path');

async function testOpenMember() {
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

  // Switch to table view
  await page.locator('button:has-text("Dạng bảng")').first().click();
  await page.waitForTimeout(1000);

  // Click the first "Xem" button in table
  const xemBtn = page.locator('tbody tr button:has-text("Xem")').first();
  console.log('Table Xem count:', await xemBtn.count());
  if (await xemBtn.count() > 0) {
    await xemBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(__dirname, 'test_crm_member_detail_drawer.png') });
  }

  // Also test clicking the "Role/Permission" button in table (the button with user/key icon next to Edit)
  const roleBtn = page.locator('tbody tr button').nth(2); // 0 is Xem, 1 is Edit, 2 is Role
  if (await roleBtn.count() > 0) {
    // Close previous drawer if open
    const closeDrawer = page.locator('button[aria-label="Close"], button:has-text("Đóng"), [data-state="open"] button').first();
    if (await closeDrawer.count() > 0) await closeDrawer.click();
    await page.waitForTimeout(500);
  }

  await browser.close();
}

testOpenMember().catch(console.error);
