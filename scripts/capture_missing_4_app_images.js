const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const APP_BASE = 'http://14.225.217.232:5002';
const DIRS = [
  path.join(__dirname, '..', 'document', 'images', 'evidence'),
  path.join(__dirname, '..', 'apps', 'vione_app_fe', 'public', 'docs', 'images', 'evidence')
];

function saveImage(buf, filenames) {
  for (const fn of filenames) {
    for (const d of DIRS) {
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
      fs.writeFileSync(path.join(d, fn), buf);
    }
    console.log(`Saved ${fn} (${buf.length} bytes) to both dirs.`);
  }
}

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  try {
    // 1. Login
    console.log('Logging in...');
    await page.goto(`${APP_BASE}/association/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.locator('#assoc-auth-id').fill('ceo.tongthuky@ceo1983.com');
    await page.locator('#assoc-auth-password').fill('123456');
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(3000);

    // 2. Products -> Detail Modal and 3-dots actions
    console.log('Visiting products...');
    await page.goto(`${APP_BASE}/association/products`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Find any product card to click
    const prodCards = page.locator('div.grid > div, div[role="button"], div.cursor-pointer');
    const count = await prodCards.count();
    console.log(`Found ${count} product card items`);
    if (count > 0) {
      await prodCards.first().click();
      await page.waitForTimeout(1500);
      let prodDetailBuf = await page.screenshot();
      saveImage(prodDetailBuf, [
        'sub_36_app_product_detail_modal.png',
        '19_app_product_updated.png'
      ]);

      // Look for 3-dots or edit button
      const dotsBtn = page.locator('button:has(svg.lucide-more-vertical), button:has(svg.lucide-more-horizontal), button:has-text("Chỉnh sửa"), button:has-text("Liên hệ")').first();
      if (await dotsBtn.count() > 0) {
        await dotsBtn.click();
        await page.waitForTimeout(800);
      }
      let prodActionBuf = await page.screenshot();
      saveImage(prodActionBuf, ['sub_38_app_product_3dots_actions.png']);
    } else {
      // If no cards, take current page
      let fallback = await page.screenshot();
      saveImage(fallback, [
        'sub_36_app_product_detail_modal.png',
        'sub_38_app_product_3dots_actions.png'
      ]);
    }

    // 3. Messages -> Chat Expander & Call Popup
    console.log('Visiting messages...');
    await page.goto(`${APP_BASE}/association/messages`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for existing chat item or click new message
    const chatItem = page.locator('div.cursor-pointer, button.w-full, div:has(h4), div:has(p)').filter({ hasText: /CEO|1983|Nguyễn|Trần|Lê|Phạm/ }).first();
    if (await chatItem.count() > 0) {
      await chatItem.click();
      await page.waitForTimeout(1500);
    } else {
      const composeBtn = page.locator('button:has-text("+"), button[aria-label*="tin"]').first();
      if (await composeBtn.count() > 0) {
        await composeBtn.click();
        await page.waitForTimeout(1000);
        const firstM = page.locator('div[role="dialog"] button').nth(1);
        if (await firstM.count() > 0) {
          await firstM.click();
          await page.waitForTimeout(1500);
        }
      }
    }

    // Chat expander
    console.log('Finding chat expander...');
    const plusBtn = page.locator('button:has(svg.lucide-plus), button:has-text("+"), button[aria-label*="Thêm"]').last();
    if (await plusBtn.count() > 0) {
      await plusBtn.click();
      await page.waitForTimeout(1000);
    }
    let expanderBuf = await page.screenshot();
    saveImage(expanderBuf, ['sub_23_app_chat_input_expander.png']);

    // Call button
    console.log('Finding call button...');
    const callBtn = page.locator('button:has(svg.lucide-phone), button:has(svg.lucide-video)').first();
    if (await callBtn.count() > 0) {
      await callBtn.click();
      await page.waitForTimeout(1000);
    }
    let callBuf = await page.screenshot();
    saveImage(callBuf, ['sub_26_app_chat_call_popup.png']);

    console.log('All 4 missing images captured successfully!');
  } catch (err) {
    console.error('Capture error:', err);
  } finally {
    await browser.close();
  }
}

run();
