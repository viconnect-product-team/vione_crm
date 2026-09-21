const { chromium } = require('playwright');

async function inspectCrm() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://14.225.217.232:5000/auth', { waitUntil: 'networkidle', timeout: 20000 });
  await page.locator('input[type="email"], input[name="email"], input[placeholder*="email"], input[type="text"]').first().fill('admin@connect.vn');
  await page.locator('input[type="password"]').first().fill('123456');
  await page.locator('button:has-text("Đăng nhập")').first().click();
  await page.waitForTimeout(3000);

  const links = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a, button, nav a, [role="button"]'));
    return anchors.map(a => ({
      text: a.innerText.trim().replace(/\n+/g, ' '),
      href: a.getAttribute('href'),
      tag: a.tagName
    })).filter(x => x.text && (x.href || x.tag === 'BUTTON'));
  });

  console.log('CRM Links/Buttons count:', links.length);
  console.log(JSON.stringify(links.filter(x => x.href), null, 2));

  await browser.close();
}

inspectCrm();
