const { chromium } = require('playwright');
const path = require('path');

async function inspectApp() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  try {
    await page.goto('http://14.225.217.232:5002/association/login', { waitUntil: 'networkidle', timeout: 20000 });
    
    // Fill credentials
    const idInput = page.locator('#assoc-auth-id, input[placeholder*="email"], input[placeholder*="M1983"]').first();
    await idInput.fill('ceo.tongthuky@ceo1983.com');

    const passInput = page.locator('#assoc-auth-password, input[type="password"]').first();
    await passInput.fill('123456');

    const submitBtn = page.locator('button[type="submit"], button:has-text("Đăng nhập")').first();
    await submitBtn.click();

    await page.waitForTimeout(3500);
    console.log('Post-login App URL:', page.url());
    await page.screenshot({ path: path.join(__dirname, 'test_app_logged_in.png') });

    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a, button, nav a, [role="button"]'));
      return anchors.map(a => ({
        text: a.innerText.trim().replace(/\n+/g, ' '),
        href: a.getAttribute('href'),
        tag: a.tagName
      })).filter(x => x.text && (x.href || x.tag === 'BUTTON'));
    });

    console.log('App Links/Buttons count:', links.length);
    console.log(JSON.stringify(links.slice(0, 30), null, 2));

  } catch (err) {
    console.error('App login error:', err);
  } finally {
    await browser.close();
  }
}

inspectApp();
