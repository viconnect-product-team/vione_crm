const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testSubScreens() {
  const crmAuth = JSON.parse(fs.readFileSync(path.join(__dirname, 'crm_auth_cache.json'), 'utf8').trim() || '{}');
  if (!crmAuth.access_token) {
    console.log('No auth cache');
    return;
  }
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
    ignoreHTTPSErrors: true
  });
  await ctx.addCookies([
    { name: 'sb-access-token', value: crmAuth.access_token, domain: '14.225.217.232', path: '/', secure: true, sameSite: 'Lax' },
    { name: 'sb-refresh-token', value: crmAuth.refresh_token || crmAuth.access_token, domain: '14.225.217.232', path: '/', secure: true, sameSite: 'Lax' }
  ]);
  const page = await ctx.newPage();
  
  // 1. Members page & click to open drawer
  console.log('Navigating to CRM Members...');
  await page.goto('https://14.225.217.232:5443/members', { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate(({ crmAuth }) => {
    localStorage.setItem('vibe_token', crmAuth.access_token);
    localStorage.setItem('vibe_refresh_token', crmAuth.refresh_token || crmAuth.access_token);
    localStorage.setItem('vba_user', JSON.stringify(crmAuth.user));
  }, { crmAuth });
  await page.goto('https://14.225.217.232:5443/members', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // Click row or detail button
  const row = await page.$('tbody tr, .member-row, table tr:nth-child(2)');
  if (row) {
    console.log('Clicking member row...');
    await row.click();
    await page.waitForTimeout(2000);
    const targetFile = path.join(__dirname, '..', 'document', 'images', 'evidence', 'step_16b_crm_member_detail_drawer.png');
    await page.screenshot({ path: targetFile });
    console.log('Saved step_16b_crm_member_detail_drawer.png');
  }

  // 2. Events page & click Create Event
  console.log('Navigating to CRM Events...');
  await page.goto('https://14.225.217.232:5443/events', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2500);
  const createBtn = await page.$('button:has-text("Tạo sự kiện"), button:has-text("Thêm sự kiện"), button:has-text("Tạo mới")');
  if (createBtn) {
    console.log('Clicking create event button...');
    await createBtn.click();
    await page.waitForTimeout(2000);
    const targetFile = path.join(__dirname, '..', 'document', 'images', 'evidence', 'step_17b_crm_event_create_modal.png');
    await page.screenshot({ path: targetFile });
    console.log('Saved step_17b_crm_event_create_modal.png');
  }

  await browser.close();
}

testSubScreens().catch(err => {
  console.error(err);
  process.exit(1);
});
