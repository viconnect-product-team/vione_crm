const { chromium } = require('playwright');

async function test() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  console.log('Logging in as ceo.tongthuky@ceo1983.com...');
  await page.goto('https://14.225.217.232:5444/association/login', { waitUntil: 'networkidle' });
  await page.locator('#assoc-auth-id').fill('ceo.tongthuky@ceo1983.com');
  await page.locator('#assoc-auth-password').fill('123456');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);

  console.log('Navigating to /association/card...');
  await page.goto('https://14.225.217.232:5444/association/card', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const bodyText = await page.innerText('body');
  console.log('Card page text snippet:\n', bodyText.slice(0, 500));

  await browser.close();
}

test().catch(console.error);
