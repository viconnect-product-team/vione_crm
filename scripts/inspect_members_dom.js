const { chromium } = require('playwright');

async function inspectMembersDom() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://14.225.217.232:5000/auth', { waitUntil: 'networkidle' });
  await page.locator('input[type="email"], input[name="email"], input[placeholder*="email"], input[type="text"]').first().fill('admin@connect.vn');
  await page.locator('input[type="password"]').first().fill('123456');
  await page.locator('button:has-text("Đăng nhập")').first().click();
  await page.waitForTimeout(3000);

  await page.goto('http://14.225.217.232:5000/members', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const elements = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, a, [role="button"], tr, .cursor-pointer')).map(el => ({
      tag: el.tagName,
      text: el.innerText.trim().replace(/\s+/g, ' ').slice(0, 50),
      className: el.className ? el.className.toString().slice(0, 50) : '',
      ariaLabel: el.getAttribute('aria-label'),
      title: el.getAttribute('title')
    })).filter(x => x.text || x.ariaLabel);
  });

  console.log('Total clickable elements:', elements.length);
  console.log(JSON.stringify(elements.slice(0, 40), null, 2));

  await browser.close();
}

inspectMembersDom();
