const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CRM_BASE = 'http://14.225.217.232:5000';
const APP_BASE = 'http://14.225.217.232:5002';

async function testInteractions() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  console.log('Testing interactions on CRM and App...');

  // 1. Test App Login & Chat elements
  const appPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await appPage.goto(`${APP_BASE}/association/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await appPage.locator('#assoc-auth-id').fill('ceo.tongthuky@ceo1983.com');
  await appPage.locator('#assoc-auth-password').fill('123456');
  await appPage.locator('form button[type="submit"]').click();
  await appPage.waitForTimeout(3000);
  console.log('App logged in. Current URL:', appPage.url());

  // Test messages create group button
  await appPage.goto(`${APP_BASE}/association/messages`, { waitUntil: 'networkidle', timeout: 30000 });
  await appPage.waitForTimeout(2000);
  const addGroupBtn = appPage.locator('button:has-text("Tạo nhóm"), button:has-text("Tạo nhóm chat ngay"), button[title*="nhóm"]').first();
  console.log('addGroupBtn count:', await addGroupBtn.count());
  if (await addGroupBtn.count() > 0) {
    await addGroupBtn.click();
    await appPage.waitForTimeout(1000);
    console.log('Group modal opened! Dialog count:', await appPage.locator('div[role="dialog"]').count());
    await appPage.keyboard.press('Escape');
    await appPage.waitForTimeout(500);
  }

  // Test opening a chat thread
  const convItem = appPage.locator('.cursor-pointer:has(p)').first();
  console.log('convItem count:', await convItem.count());
  if (await convItem.count() > 0) {
    await convItem.click();
    await appPage.waitForTimeout(2000);
    console.log('Entered chat thread. URL/State:', appPage.url());
    
    // Check call button
    const phoneBtn = appPage.locator('button:has(svg.lucide-phone)').first();
    console.log('Phone button count:', await phoneBtn.count());

    // Check plus button (expander)
    const plusBtn = appPage.locator('button:has(svg.lucide-plus)').last();
    console.log('Plus button count:', await plusBtn.count());
    if (await plusBtn.count() > 0) {
      await plusBtn.click();
      await appPage.waitForTimeout(800);
      console.log('Expander clicked. Location icon count:', await appPage.locator('svg.lucide-map-pin').count());
    }
  }

  // Test products 3-dots
  await appPage.goto(`${APP_BASE}/association/products`, { waitUntil: 'networkidle', timeout: 30000 });
  await appPage.waitForTimeout(2000);
  const dotBtn = appPage.locator('button[title="Tùy chọn sản phẩm"], button:has(svg.lucide-more-vertical)').first();
  console.log('3-dots button count:', await dotBtn.count());

  await browser.close();
  console.log('Test completed!');
}

testInteractions().catch(console.error);
