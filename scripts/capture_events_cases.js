const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const APP_BASE = 'https://14.225.217.232:5444';
const DOC_DIR = path.join(__dirname, '..', 'document', 'images', 'evidence');
const FE_DIR = path.join(__dirname, '..', 'apps', 'vione_app_fe', 'public', 'docs', 'images', 'evidence');

[DOC_DIR, FE_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function saveSnap(buf, filenames, title) {
  filenames.forEach(name => {
    fs.writeFileSync(path.join(DOC_DIR, name), buf);
    fs.writeFileSync(path.join(FE_DIR, name), buf);
    console.log(`  ✓ [SAVED] ${name.padEnd(42)} (${buf.length.toLocaleString()} B) -> ${title}`);
  });
}

async function run() {
  console.log('>>> Starting Event Modals & Payment Evidence Capture...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--ignore-certificate-errors', '--no-sandbox']
  });

  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    ignoreHTTPSErrors: true
  });

  const page = await ctx.newPage();

  // 1. Login
  console.log('1. Logging into App...');
  await page.goto(`${APP_BASE}/association/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.fill('input[type="email"], input[placeholder*="email" i]', 'ceo.tongthuky@ceo1983.com');
  await page.fill('input[type="password"]', '123456');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);

  // 2. Go to events
  console.log('2. Navigating to Events...');
  await page.goto(`${APP_BASE}/association/events`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // List all items
  const items = page.locator('[role="listitem"]');
  const count = await items.count();
  console.log(`Found ${count} event cards`);

  // CASE 1: FREE EVENT (Card 0)
  if (count > 0) {
    console.log('3. Clicking Free Event (Card 0)...');
    await items.nth(0).click();
    await page.waitForTimeout(1500);

    let buf = await page.screenshot();
    saveSnap(buf, [
      'sub_30_app_event_detail_modal.png',
      '06_app_event_detail_modal.png',
      'app_05_event_detail_modal.png'
    ], 'Modal Chi tiết Sự kiện Miễn phí (0đ) trên App Hiệp hội');

    // Click "Đăng ký tham gia ngay"
    const regBtn = page.locator('button:has-text("Đăng ký tham gia ngay")').first();
    if (await regBtn.count() > 0) {
      console.log('4. Clicking Register button in detail modal...');
      await regBtn.click();
      await page.waitForTimeout(1500);

      buf = await page.screenshot();
      saveSnap(buf, [
        'sub_30a_app_event_free_form.png'
      ], 'Form Đăng ký tham dự Sự kiện Miễn phí 0đ');

      // Submit registration
      const confirmBtn = page.locator('button:has-text("Xác nhận đăng ký vé miễn phí")').first();
      if (await confirmBtn.count() > 0) {
        console.log('5. Submitting Free Registration...');
        await confirmBtn.click();
        await page.waitForTimeout(2000);

        buf = await page.screenshot();
        saveSnap(buf, [
          'sub_31_app_event_ticket_pass.png',
          '14_app_event_checkin_pass.png',
          'app_06_event_ticket_pass.png'
        ], 'Vé Pass Điện Tử Sự Kiện 0đ kèm Mã QR Check-in & Số may mắn #XXXX');
      }
    }
  }

  // Reload events page for Case 2
  console.log('6. Navigating back to Events for Case 2...');
  await page.goto(`${APP_BASE}/association/events`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // CASE 2: PAID EVENT (Card 1)
  const items2 = page.locator('[role="listitem"]');
  const count2 = await items2.count();
  if (count2 > 1) {
    console.log('7. Clicking Paid Event (Card 1)...');
    await items2.nth(1).click();
    await page.waitForTimeout(1500);

    let buf = await page.screenshot();
    saveSnap(buf, [
      'sub_30b_app_event_paid_detail.png'
    ], 'Modal Chi tiết Sự kiện Thu phí Gala Dinner (500.000 VNĐ)');

    // Click "Đăng ký tham gia ngay"
    const regBtnPaid = page.locator('button:has-text("Đăng ký tham gia ngay")').first();
    if (await regBtnPaid.count() > 0) {
      console.log('8. Clicking Register for Paid Event...');
      await regBtnPaid.click();
      await page.waitForTimeout(1500);

      buf = await page.screenshot();
      saveSnap(buf, [
        'sub_30c_app_event_paid_form.png'
      ], 'Form Đăng ký Sự kiện Có phí (500.000 VNĐ) hiển thị tóm tắt chi phí');

      // Submit
      const confirmPaidBtn = page.locator('button:has-text("Xác nhận & Gửi đăng ký")').first();
      if (await confirmPaidBtn.count() > 0) {
        console.log('9. Submitting Paid Registration...');
        await confirmPaidBtn.click();
        await page.waitForTimeout(2000);

        buf = await page.screenshot();
        saveSnap(buf, [
          'sub_30d_app_event_paid_qr_modal.png',
          '08_app_vietqr_payment_modal.png',
          'app_07_vietqr_payment_modal.png'
        ], 'Modal Xác nhận Đăng ký Có phí & Hướng dẫn Thanh toán VietQR Napas 247');
      }
    }
  }

  // Also capture Checkin QR Screen
  console.log('10. Navigating to Check-in / Ticket Screen...');
  await page.goto(`${APP_BASE}/association/checkin`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  let checkinBuf = await page.screenshot();
  saveSnap(checkinBuf, [
    'sub_31b_app_checkin_screen.png'
  ], 'Màn hình Thẻ vé Check-in của tôi với mã QR động');

  await browser.close();
  console.log('>>> Event Modals Capture Completed!');
}

run().catch(console.error);
