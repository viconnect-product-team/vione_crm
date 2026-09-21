const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testLanding() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('Testing /landing/ceo1983...');
  await page.goto('http://14.225.217.232:5002/landing/ceo1983', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(__dirname, 'test_landing_ceo1983.png') });

  console.log('Testing /landing/ceo1983/cinematic...');
  await page.goto('http://14.225.217.232:5002/landing/ceo1983/cinematic', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(__dirname, 'test_landing_cinematic.png') });

  console.log('Testing /landing/ceo/v1...');
  await page.goto('http://14.225.217.232:5002/landing/ceo/v1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(__dirname, 'test_landing_ceo_v1.png') });

  await browser.close();
}

testLanding().catch(console.error);
