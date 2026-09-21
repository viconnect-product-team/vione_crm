const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
  
  await p.goto('http://14.225.217.232:5002/association/login', { waitUntil: 'networkidle' });
  await p.locator('#assoc-auth-id').fill('ceo.tongthuky@ceo1983.com');
  await p.locator('#assoc-auth-password').fill('123456');
  await p.locator('form button[type="submit"]').click();
  await p.waitForTimeout(3000);

  // Test /association/messages with peerCode
  await p.goto('http://14.225.217.232:5002/association/messages?peerCode=M1983-002&peerName=Trần%20Quốc%20Bảo', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  const phoneBtn = p.locator('button:has(svg.lucide-phone)').first();
  console.log('Phone button count:', await phoneBtn.count());
  const plusBtn = p.locator('button:has(svg.lucide-plus)').last();
  console.log('Plus button count:', await plusBtn.count());

  if (await plusBtn.count() > 0) {
    await plusBtn.click();
    await p.waitForTimeout(800);
    console.log('Plus clicked. Actions visible:', await p.locator('button:has-text("Vị trí"), button:has-text("Ảnh"), button:has-text("Tệp")').count());
  }

  // Click call button
  if (await phoneBtn.count() > 0) {
    await phoneBtn.click();
    await p.waitForTimeout(1000);
    console.log('Call modal opened! Text includes "Đang kết nối":', (await p.innerText('body')).includes('Đang'));
    const endBtn = p.locator('button.bg-rose-600, button:has-text("Kết thúc"), button[title*="ngắt"]').first();
    if (await endBtn.count() > 0) await endBtn.click();
    await p.waitForTimeout(500);
  }

  // Test products
  await p.goto('http://14.225.217.232:5002/association/products', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  const cards = p.locator('div[class*="rounded"]:has(h3)');
  console.log('Product cards count:', await cards.count());
  if (await cards.count() > 0) {
    await cards.first().click();
    await p.waitForTimeout(1000);
    console.log('Product detail opened! Title:', await p.locator('h2, h3').first().innerText());
  }

  await browser.close();
})();
