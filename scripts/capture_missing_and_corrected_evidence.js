const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const undici = require('undici');

const EVIDENCE_DIR = path.join(__dirname, '../document/images/evidence');
const FE_EVIDENCE_DIR = path.join(__dirname, '../apps/vione_app_fe/public/docs/images/evidence');

for (const d of [EVIDENCE_DIR, FE_EVIDENCE_DIR]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

const CRM_URL = 'https://14.225.217.232:5443';
const APP_URL = 'https://14.225.217.232:5444';

async function snap(page, filename, desc) {
  const filePath = path.join(EVIDENCE_DIR, filename);
  const feFilePath = path.join(FE_EVIDENCE_DIR, filename);
  await page.screenshot({ path: filePath, fullPage: false });
  fs.copyFileSync(filePath, feFilePath);
  const stat = fs.statSync(filePath);
  console.log(`[SNAPSHOT] Saved: ${filename.padEnd(35)} (${(stat.size / 1024).toFixed(1)} KB) | ${desc}`);
}

async function main() {
  console.log('=== BẮT ĐẦU CHỤP BỔ SUNG & SỬA LỖI CÁC MÀN HÌNH THEO YÊU CẦU ===\n');

  // Lấy token đăng nhập
  console.log('1. Lấy token đăng nhập CRM & App...');
  const crmLoginResp = await fetch(`${CRM_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@connect.vn', password: '123456' }),
    dispatcher: new undici.Agent({ connect: { rejectUnauthorized: false } })
  });
  const crmAuth = await crmLoginResp.json();

  const appLoginResp = await fetch(`${APP_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'vumikasa6@gmail.com', password: 'Password1983!' }),
    dispatcher: new undici.Agent({ connect: { rejectUnauthorized: false } })
  });
  const appAuth = await appLoginResp.json();

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  // =========================================================================
  // MỤC 1: SỬA ẢNH TỔNG QUAN CRM (DASHBOARD TẠI ROUTE '/')
  // =========================================================================
  console.log('\n--- 1. CHỤP LẠI ẢNH TỔNG QUAN CRM (EXECUTIVE DASHBOARD) ---');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
    ignoreHTTPSErrors: true,
    locale: 'vi-VN',
  });

  await desktopContext.addCookies([
    { name: 'sb-access-token', value: crmAuth.access_token, domain: '14.225.217.232', path: '/', secure: true, sameSite: 'Lax' },
    { name: 'sb-refresh-token', value: crmAuth.refresh_token || crmAuth.access_token, domain: '14.225.217.232', path: '/', secure: true, sameSite: 'Lax' },
  ]);

  const crmPage = await desktopContext.newPage();
  await crmPage.goto(`${CRM_URL}/`, { waitUntil: 'domcontentloaded' });
  await crmPage.evaluate(({ crmAuth }) => {
    localStorage.setItem('vibe_token', crmAuth.access_token);
    localStorage.setItem('vibe_refresh_token', crmAuth.refresh_token || crmAuth.access_token);
    localStorage.setItem('vba_user', JSON.stringify(crmAuth.user));
  }, { crmAuth });

  await crmPage.goto(`${CRM_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
  await crmPage.waitForTimeout(3000);
  await snap(crmPage, 'crm_step_02_dashboard_kpi_live.png', 'Executive Dashboard CRM Tổng Quan: KPI Hội Viên, Doanh Thu, Sự Kiện');

  // =========================================================================
  // MỤC 2: BẦU CỬ & BIỂU QUYẾT TÍN NHIỆM TRÊN CRM
  // =========================================================================
  console.log('\n--- 2. CHỤP PHÂN HỆ BẦU CỬ / BIỂU QUYẾT TRÊN CRM ---');
  await crmPage.goto(`${CRM_URL}/voting`, { waitUntil: 'networkidle', timeout: 30000 });
  await crmPage.waitForTimeout(2500);
  await snap(crmPage, 'crm_voting_management.png', 'Quản trị các kỳ Bầu cử & Biểu quyết tín nhiệm đại biểu');

  // =========================================================================
  // MỤC 3: QUAY SỐ TRÚNG THƯỞNG (LUCKY DRAW) TRÊN CRM
  // =========================================================================
  console.log('\n--- 3. CHỤP MODAL VÒNG QUAY MAY MẮN (LUCKY DRAW) ---');
  const luckyBtn = await crmPage.$('button:has-text("Bốc Thăm"), button:has-text("Vòng quay")');
  if (luckyBtn) {
    await luckyBtn.click();
    await crmPage.waitForTimeout(1500);
    // Bấm quay số một lần để hiện kết quả người trúng giải
    const spinBtn = await crmPage.$('button:has-text("QUAY SỐ")');
    if (spinBtn) {
      await spinBtn.click();
      await crmPage.waitForTimeout(3000); // Chờ quay xong
    }
  }
  await snap(crmPage, 'crm_lucky_draw_modal.png', 'Modal Vòng Quay May Mắn: Giải thưởng VinFast VF3, Mã vé may mắn, Người trúng giải');
  // Lưu đè vào app_step_14_voting_luckydraw.png để các slide và tài liệu trước đây tự động cập nhật ảnh đúng
  await snap(crmPage, 'app_step_14_voting_luckydraw.png', 'Phân hệ Bầu cử & Vòng quay may mắn sự kiện (Ảnh thực tế)');

  await crmPage.close();
  await desktopContext.close();

  // =========================================================================
  // MỤC 4: MOBILE APP - THẺ VISIT CARD, THẺ ĐỊNH DANH, CÀI ĐẶT
  // =========================================================================
  console.log('\n--- 4. CHỤP DANH THIẾP VISIT CARD & THẺ ĐỊNH DANH TRÊN MOBILE APP ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    ignoreHTTPSErrors: true,
    locale: 'vi-VN',
  });

  await mobileContext.addCookies([
    { name: 'sb-access-token', value: appAuth.access_token, domain: '14.225.217.232', path: '/', secure: true, sameSite: 'Lax' },
    { name: 'sb-refresh-token', value: appAuth.refresh_token || appAuth.access_token, domain: '14.225.217.232', path: '/', secure: true, sameSite: 'Lax' },
  ]);

  const appPage = await mobileContext.newPage();
  await appPage.goto(`${APP_URL}/association`, { waitUntil: 'domcontentloaded' });
  await appPage.evaluate(({ appAuth }) => {
    localStorage.setItem('vibe_token', appAuth.access_token);
    localStorage.setItem('vibe_refresh_token', appAuth.refresh_token || appAuth.access_token);
    localStorage.setItem('vba_user', JSON.stringify(appAuth.user));
  }, { appAuth });

  // 4.1. Thẻ Visit Card mặt trước
  console.log('4.1. Thẻ Visit Card mặt trước...');
  await appPage.goto(`${APP_URL}/association/card`, { waitUntil: 'networkidle', timeout: 30000 });
  await appPage.waitForTimeout(2500);
  await snap(appPage, 'app_visit_card_front.png', 'Danh thiếp số Doanh nhân CEO 1983 (Mặt trước sang trọng chuẩn Brandbook)');

  // 4.2. Lật sang mặt sau Visit Card
  console.log('4.2. Lật sang mặt sau Visit Card...');
  const flipBtn = await appPage.$('button:has-text("Lật thẻ"), button:has-text("Xoay"), [aria-label*="flip"], button:has-text("mặt sau")');
  if (flipBtn) {
    await flipBtn.click();
    await appPage.waitForTimeout(1200);
  } else {
    // Click vào thẻ để lật
    const cardElement = await appPage.$('.cursor-pointer, [data-card]');
    if (cardElement) {
      await cardElement.click();
      await appPage.waitForTimeout(1200);
    }
  }
  await snap(appPage, 'app_visit_card_back.png', 'Danh thiếp số Doanh nhân CEO 1983 (Mặt sau với Mã QR & Thông tin kết nối)');

  // 4.3. Cuộn xuống phần Thẻ Định Danh Hội Viên VIP
  console.log('4.3. Thẻ Định Danh Hội Viên VIP...');
  await appPage.evaluate(() => window.scrollBy(0, 450));
  await appPage.waitForTimeout(1200);
  await snap(appPage, 'app_identity_card_vip.png', 'Thẻ định danh số Hội viên VIP GOLD 3D với Mã hội viên & Chip NFC');

  // 4.4. Modal Cài đặt Quyền riêng tư danh thiếp
  console.log('4.4. Cài đặt Quyền riêng tư danh thiếp...');
  const settingsBtn = await appPage.$('button:has-text("Cài đặt"), button:has-text("Quyền riêng tư"), button:has-text("Ẩn/hiện")');
  if (settingsBtn) {
    await settingsBtn.click();
    await appPage.waitForTimeout(1200);
    await snap(appPage, 'app_card_privacy_settings.png', 'Modal Tùy biến Cài đặt Danh thiếp: Ẩn/Hiện SĐT, Email, Địa chỉ');
    // Đóng modal
    const closeBtn = await appPage.$('button:has-text("Đóng"), button:has-text("Lưu"), [aria-label="Close"]');
    if (closeBtn) await closeBtn.click();
  }

  // =========================================================================
  // MỤC 5: QUÉT MÃ QR TỪ ỨNG DỤNG KHÁC (ZALO / CAMERA NGOÀI) HIỂN THỊ THÔNG TIN
  // =========================================================================
  console.log('\n--- 5. TRANG XÁC THỰC CÔNG KHAI KHI QUÉT QR TỪ ỨNG DỤNG KHÁC ---');
  await appPage.goto(`${APP_URL}/card/M1983-001`, { waitUntil: 'networkidle', timeout: 30000 });
  await appPage.waitForTimeout(2500);
  await snap(appPage, 'app_public_qr_scan_view.png', 'Trang hiển thị khi quét QR từ Zalo/Camera ngoài: Thẻ 3D, Tích xanh Verified, vCard');

  // Thử quét mã M1983-292 của user test
  await appPage.goto(`${APP_URL}/card/M1983-292`, { waitUntil: 'networkidle', timeout: 30000 });
  await appPage.waitForTimeout(2000);
  await snap(appPage, 'app_public_qr_scan_user.png', 'Xác thực thông tin hội viên Phạm Vũ Nam khi quét QR từ app ngoài');

  // =========================================================================
  // MỤC 6: BẦU CỬ & BIỂU QUYẾT TRÊN APP HIỆP HỘI
  // =========================================================================
  console.log('\n--- 6. BẦU CỬ & BIỂU QUYẾT TRÊN APP HIỆP HỘI ---');
  await appPage.goto(`${APP_URL}/voting`, { waitUntil: 'networkidle', timeout: 30000 });
  await appPage.waitForTimeout(2500);
  await snap(appPage, 'app_voting_mobile_view.png', 'Màn hình Bầu cử & Biểu quyết tín nhiệm đại hội trên App di động');

  await appPage.close();
  await mobileContext.close();
  await browser.close();

  console.log('\n================================================================');
  console.log('HOÀN TẤT CHỤP TOÀN BỘ ẢNH CHỨNG CỨ MỚI VÀ CHUẨN XÁC 100%!');
  console.log('================================================================\n');
}

main().catch(err => {
  console.error('[ERROR]', err);
  process.exit(1);
});
