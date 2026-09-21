const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const APP_BASE = 'https://14.225.217.232:5444';
const DOC_DIR = path.join(__dirname, '..', 'document', 'images', 'evidence');
const FE_DIR = path.join(__dirname, '..', 'apps', 'vione_app_fe', 'public', 'docs', 'images', 'evidence');

async function test() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--ignore-certificate-errors'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, ignoreHTTPSErrors: true });
  
  await page.goto(`${APP_BASE}/association/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'ceo.tongthuky@ceo1983.com');
  await page.fill('input[type="password"]', '123456');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  await page.goto(`${APP_BASE}/association/events`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const items = page.locator('[role="listitem"]');
  const count = await items.count();
  console.log('Items count:', count);
  
  // Find card with 500.000 đ or Gala Dinner
  let paidIndex = 1;
  for (let i = 0; i < count; i++) {
    const text = await items.nth(i).innerText();
    if (text.includes('500.000') || text.includes('Gala') || text.includes('PAID')) {
      paidIndex = i;
      break;
    }
  }

  console.log(`Clicking paid event card at index ${paidIndex}...`);
  await items.nth(paidIndex).click();
  await page.waitForTimeout(1200);

  const regBtn = page.locator('button:has-text("Đăng ký tham gia ngay")').first();
  if (await regBtn.count() > 0) {
    await regBtn.click();
    await page.waitForTimeout(1200);

    // Ensure inputs are filled
    await page.fill('input[placeholder*="Nguyễn Văn An"]', 'Lê Hoàng Long');
    await page.fill('input[placeholder*="0988"]', '0912345678');
    await page.fill('input[placeholder*="company"]', 'Long Tech Solutions');
    await page.waitForTimeout(500);

    // Click submit
    console.log('Clicking submit button...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2500);

    const buf = await page.screenshot();
    const names = [
      'sub_30d_app_event_paid_qr_modal.png',
      '08_app_vietqr_payment_modal.png',
      'app_07_vietqr_payment_modal.png'
    ];
    names.forEach(n => {
      fs.writeFileSync(path.join(DOC_DIR, n), buf);
      fs.writeFileSync(path.join(FE_DIR, n), buf);
      console.log('Saved:', n, `(${buf.length} bytes)`);
    });
  }

  await browser.close();
  console.log('Done!');
}

test().catch(console.error);
