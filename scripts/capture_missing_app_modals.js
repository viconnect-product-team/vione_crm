const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const APP_BASE = 'http://14.225.217.232:5002';
const EVIDENCE_DIR = path.join(__dirname, '..', 'document', 'images', 'evidence');

function saveFiles(buffer, filenames) {
  for (const fn of filenames) {
    const target = path.join(EVIDENCE_DIR, fn);
    fs.writeFileSync(target, buffer);
    console.log(`  [SAVED] ${fn} (${buffer.length} bytes)`);
  }
}

async function captureMissingModals() {
  console.log('Starting capture of missing App modals...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const appPage = await browser.newPage({ viewport: { width: 390, height: 844 } });

  try {
    // 1. Log in
    console.log('Logging in to App...');
    await appPage.goto(`${APP_BASE}/association/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await appPage.locator('#assoc-auth-id').fill('ceo.tongthuky@ceo1983.com');
    await appPage.locator('#assoc-auth-password').fill('123456');
    await appPage.locator('form button[type="submit"]').click();
    await appPage.waitForTimeout(3000);

    // 2. Events -> Event Detail Modal & Register / VietQR Modal
    console.log('Capturing Event Detail Modal...');
    await appPage.goto(`${APP_BASE}/association/events`, { waitUntil: 'networkidle', timeout: 30000 });
    await appPage.waitForTimeout(2000);

    const viewDetailSpan = appPage.locator('text="Xem chi tiết"').first();
    if (await viewDetailSpan.count() > 0) {
      await viewDetailSpan.click();
      await appPage.waitForTimeout(1500);
      let buf = await appPage.screenshot();
      saveFiles(buf, [
        '06_app_event_detail_modal.png',
        'sub_30_app_event_detail_modal.png',
        'app_05_event_detail_modal.png'
      ]);

      // Click Đăng ký tham gia ngay
      console.log('Capturing Event Registration & VietQR Payment Modal...');
      const regBtn = appPage.locator('button:has-text("Đăng ký tham gia ngay"), button:has-text("Đăng ký")').first();
      if (await regBtn.count() > 0) {
        await regBtn.click();
        await appPage.waitForTimeout(1500);
        buf = await appPage.screenshot();
        saveFiles(buf, [
          '08_app_vietqr_payment_modal.png',
          'app_07_vietqr_payment_modal.png'
        ]);
      }
    } else {
      console.warn('  "Xem chi tiết" not found on events page');
    }

    // 3. Messages -> 1-1 Chat Thread & Actions
    console.log('Capturing Chat Thread & Actions...');
    await appPage.goto(`${APP_BASE}/association/messages`, { waitUntil: 'networkidle', timeout: 30000 });
    await appPage.waitForTimeout(2000);

    // Click "+" or new message button or picker
    const composeBtn = appPage.locator('button:has-text("+"), button[aria-label*="nhóm"], button[aria-label*="tin nhắn"]').first();
    if (await composeBtn.count() > 0) {
      await composeBtn.click();
      await appPage.waitForTimeout(1000);
      // Select first member in list
      const firstMember = appPage.locator('div[role="dialog"] button:has(p), div[role="dialog"] button:has(span), button.flex.items-center').nth(1);
      if (await firstMember.count() > 0) {
        await firstMember.click();
        await appPage.waitForTimeout(2000);
      }
    }

    let chatBuf = await appPage.screenshot();
    saveFiles(chatBuf, [
      '25_app_chat_conversation.png',
      'sub_22_app_chat_1on1_bubble.png',
      'app_15_chat_messenger_thread.png',
      'sub_24_app_chat_location_pin.png',
      'sub_25_app_chat_recalled_msg.png'
    ]);

    // Click expander (+) in chat
    const chatExpander = appPage.locator('div.border-t button:has(svg.lucide-plus), div.border-t button:has-text("+")').first();
    if (await chatExpander.count() > 0) {
      await chatExpander.click();
      await appPage.waitForTimeout(800);
      chatBuf = await appPage.screenshot();
      saveFiles(chatBuf, [
        '09_app_chat_call_messenger_bubble.png',
        'sub_23_app_chat_input_expander.png'
      ]);
    }

    // Click Call button in chat header
    const phoneBtn = appPage.locator('header button:has(svg.lucide-phone), button:has(svg.lucide-phone)').first();
    if (await phoneBtn.count() > 0) {
      await phoneBtn.click();
      await appPage.waitForTimeout(1000);
      chatBuf = await appPage.screenshot();
      saveFiles(chatBuf, [
        'sub_26_app_chat_call_popup.png'
      ]);
    }

    // 4. Profile -> Contact Secretariat Modal
    console.log('Capturing Contact Secretariat Modal...');
    await appPage.goto(`${APP_BASE}/association/profile`, { waitUntil: 'networkidle', timeout: 30000 });
    await appPage.waitForTimeout(2000);

    const contactSecBtn = appPage.locator('text="Liên hệ Ban Thư Ký CLB CEO 1983"').first();
    if (await contactSecBtn.count() > 0) {
      await contactSecBtn.scrollIntoViewIfNeeded();
      await contactSecBtn.click();
      await appPage.waitForTimeout(1500);
      const buf = await appPage.screenshot();
      saveFiles(buf, [
        'sub_45_app_contact_secretariat_modal.png'
      ]);
      await appPage.keyboard.press('Escape');
      await appPage.waitForTimeout(500);
    } else {
      console.warn('  Contact Secretariat button not found');
    }

    // 5. Profile -> User Guide PDF Viewer Modal
    console.log('Capturing User Guide PDF Viewer Modal...');
    await appPage.goto(`${APP_BASE}/association/profile`, { waitUntil: 'networkidle', timeout: 30000 });
    await appPage.waitForTimeout(2000);

    const userGuideBtn = appPage.locator('text="Hướng dẫn sử dụng App Doanh Nhân"').first();
    if (await userGuideBtn.count() > 0) {
      await userGuideBtn.scrollIntoViewIfNeeded();
      await userGuideBtn.click();
      await appPage.waitForTimeout(2500);
      const buf = await appPage.screenshot();
      saveFiles(buf, [
        '10_app_user_guide_pdf_viewer.png',
        'sub_46_app_user_guide_modal.png',
        'app_16_user_guide_pdf_viewer.png'
      ]);
    } else {
      console.warn('  User Guide button not found');
    }

    console.log('Finished missing modals capture!');
  } catch (err) {
    console.error('Error during modal capture:', err);
  } finally {
    await browser.close();
  }
}

captureMissingModals();
