const { chromium } = require('playwright');
const path = require('path');

async function testLogin() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    await page.goto('http://14.225.217.232:5000/auth', { waitUntil: 'networkidle', timeout: 20000 });
    
    // Fill credentials
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"], input[type="text"]').first();
    await emailInput.fill('admin@connect.vn');

    const passInput = page.locator('input[type="password"]').first();
    await passInput.fill('123456');

    // Click submit
    const submitBtn = page.locator('button:has-text("Đăng nhập")').first();
    await submitBtn.click();

    await page.waitForTimeout(3000);
    console.log('Post-login CRM URL:', page.url());
    await page.screenshot({ path: path.join(__dirname, 'test_crm_logged_in.png') });

    // Check localStorage and cookies
    const storage = await page.evaluate(() => ({
      localStorage: { ...localStorage },
      cookies: document.cookie
    }));
    console.log('CRM Storage keys:', Object.keys(storage.localStorage));
  } catch (err) {
    console.error('CRM login error:', err);
  } finally {
    await browser.close();
  }
}

testLogin();
