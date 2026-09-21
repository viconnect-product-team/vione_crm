const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CRM_BASE = 'http://14.225.217.232:5000';
const OUT_DIR = path.join(__dirname, 'crm_captures');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function captureCrm() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('1. Capturing CRM Login...');
  await page.goto(`${CRM_BASE}/auth`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '01_crm_login.png') });

  // Type credentials into the login page
  console.log('Logging in...');
  await page.locator('input[type="email"], input[name="email"], input[placeholder*="email"], input[type="text"]').first().fill('admin@connect.vn');
  await page.locator('input[type="password"]').first().fill('123456');
  await page.locator('button:has-text("Đăng nhập")').first().click();
  await page.waitForTimeout(3000);

  // 2. Dashboard
  console.log('2. Capturing CRM Dashboard...');
  await page.goto(`${CRM_BASE}/`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '02_crm_dashboard.png') });

  // 3. Members List
  console.log('3. Capturing CRM Members List...');
  await page.goto(`${CRM_BASE}/members`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '03_crm_members_list.png') });

  // 4. Member Detail Drawer / Modal
  console.log('4. Capturing CRM Member Detail Drawer...');
  const memberRow = page.locator('table tbody tr, div[role="row"], .cursor-pointer').first();
  if (await memberRow.count() > 0) {
    await memberRow.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT_DIR, '04_crm_member_drawer.png') });
  }

  // 5. Companies
  console.log('5. Capturing CRM Companies...');
  await page.goto(`${CRM_BASE}/companies`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '05_crm_companies.png') });

  // 6. Events List
  console.log('6. Capturing CRM Events...');
  await page.goto(`${CRM_BASE}/events`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '06_crm_events.png') });

  // 7. Event Create Modal
  console.log('7. Capturing CRM Event Create Modal...');
  const createEventBtn = page.locator('button:has-text("Tạo sự kiện"), button:has-text("Thêm sự kiện"), button:has-text("Tạo mới")').first();
  if (await createEventBtn.count() > 0) {
    await createEventBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT_DIR, '07_crm_event_create_modal.png') });
    // Close modal if open
    const closeBtn = page.locator('button:has-text("Hủy"), button[aria-label="Close"], button:has-text("Đóng")').first();
    if (await closeBtn.count() > 0) await closeBtn.click();
    await page.waitForTimeout(500);
  }

  // 8. Event Overview / Registrations / Checkin
  console.log('8. Capturing CRM Event Registrations & Check-in...');
  await page.goto(`${CRM_BASE}/event-registrations`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '08_crm_event_registrations.png') });

  await page.goto(`${CRM_BASE}/checkin`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '08b_crm_checkin.png') });

  await page.goto(`${CRM_BASE}/checkin-qr`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '08c_crm_checkin_qr.png') });

  // 9. Fees (Hội phí)
  console.log('9. Capturing CRM Fees...');
  await page.goto(`${CRM_BASE}/fees`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '09_crm_fees.png') });

  // 10. Marketplace
  console.log('10. Capturing CRM Marketplace...');
  await page.goto(`${CRM_BASE}/marketplace`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '10_crm_marketplace.png') });

  // 11. Opportunities
  console.log('11. Capturing CRM Opportunities...');
  await page.goto(`${CRM_BASE}/opportunities`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '11_crm_opportunities.png') });

  // 12. Voting & Lucky Draw
  console.log('12. Capturing CRM Voting...');
  await page.goto(`${CRM_BASE}/voting`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '12_crm_voting.png') });

  // 13. News
  console.log('13. Capturing CRM News...');
  await page.goto(`${CRM_BASE}/news`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '13_crm_news.png') });

  // 14. Settings
  console.log('14. Capturing CRM Settings...');
  await page.goto(`${CRM_BASE}/settings`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '14_crm_settings.png') });

  // 15. Activity / Audit Logs
  console.log('15. Capturing CRM Activity...');
  await page.goto(`${CRM_BASE}/activity`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '15_crm_activity.png') });

  console.log('CRM capturing completed successfully!');
  await browser.close();
}

captureCrm().catch(console.error);
