const { chromium } = require('playwright');
const path = require('path');

async function testAppLogin() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  try {
    await page.goto('http://14.225.217.232:5002/association/login', { waitUntil: 'networkidle', timeout: 20000 });

    await page.locator('#assoc-auth-id').fill('ceo.tongthuky@ceo1983.com');
    await page.locator('#assoc-auth-password').fill('123456');

    // Click specifically the submit button inside form
    await page.locator('form button[type="submit"]').click();
    console.log('Clicked form submit button!');

    await page.waitForTimeout(4000);
    console.log('Current URL after submit:', page.url());
    await page.screenshot({ path: path.join(__dirname, 'test_app_real_home.png') });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

testAppLogin();
