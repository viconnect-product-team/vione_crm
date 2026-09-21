const { chromium } = require('playwright');
const path = require('path');

async function testMemberDetails() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://14.225.217.232:5000/auth', { waitUntil: 'networkidle' });
  await page.locator('input[type="email"], input[name="email"], input[placeholder*="email"], input[type="text"]').first().fill('admin@connect.vn');
  await page.locator('input[type="password"]').first().fill('123456');
  await page.locator('button:has-text("Đăng nhập")').first().click();
  await page.waitForTimeout(3000);

  await page.goto('http://14.225.217.232:5000/members', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Find all links to /members/
  const memberLinks = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href*="/members/"]'));
    return anchors.map(a => a.getAttribute('href'));
  });
  console.log('Member Links found on page:', memberLinks);

  if (memberLinks.length > 0) {
    const targetUrl = 'http://14.225.217.232:5000' + memberLinks[0];
    console.log('Navigating to member detail:', targetUrl);
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(__dirname, 'test_member_detail_page.png') });
  }

  // Go back to /members and switch to table view to open Account Modal
  await page.goto('http://14.225.217.232:5000/members', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.locator('button:has-text("Dạng bảng")').first().click();
  await page.waitForTimeout(1000);

  // Click the Account / UserCog button (third button in actions)
  const userCogBtn = page.locator('tbody tr button[title*="tài khoản"], tbody tr button[aria-label*="tài khoản"], tbody tr button:nth-of-type(2)').first();
  console.log('UserCog button count:', await userCogBtn.count());
  if (await userCogBtn.count() > 0) {
    await userCogBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(__dirname, 'test_member_account_modal.png') });
  }

  await browser.close();
}

testMemberDetails().catch(console.error);
