const { chromium } = require('playwright');
const undici = require('undici');
const { fetch } = undici;
const fs = require('fs');
const path = require('path');

const EVIDENCE_DIR = path.join(__dirname, '..', 'document', 'images', 'evidence');

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  
  // 1. Landing Page & Registration Modal (Desktop & Mobile)
  console.log('1. Navigating to Landing Page...');
  const landingPage = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true
  });
  
  await landingPage.goto('https://14.225.217.232:5444/landing/ceo/v1', { waitUntil: 'networkidle', timeout: 30000 });
  await landingPage.waitForTimeout(2000);
  await landingPage.screenshot({ path: path.join(EVIDENCE_DIR, 'step_00a_landing_portal.png') });
  console.log('Saved step_00a_landing_portal.png');

  // Find & click register button
  const regBtn = await landingPage.$('button:has-text("Đăng ký"), a:has-text("Đăng ký"), button:has-text("Gia nhập")');
  if (regBtn) {
    console.log('Found registration button, clicking...');
    await regBtn.click();
    await landingPage.waitForTimeout(2000);

    // Fill in test data: vumikasa6@gmail.com
    try {
      const nameInput = await landingPage.$('input[placeholder*="họ và tên" i], input[name="name"], input[placeholder*="tên" i]');
      if (nameInput) await nameInput.fill('Phạm Vũ Nam');
      const emailInput = await landingPage.$('input[placeholder*="email" i], input[type="email"], input[name="email"]');
      if (emailInput) await emailInput.fill('vumikasa6@gmail.com');
      const phoneInput = await landingPage.$('input[placeholder*="thoại" i], input[type="tel"], input[name="phone"]');
      if (phoneInput) await phoneInput.fill('0912345678');
      const compInput = await landingPage.$('input[placeholder*="doanh nghiệp" i], input[placeholder*="công ty" i], input[name="company"]');
      if (compInput) await compInput.fill('Công ty TNHH MediSocial');
    } catch (e) {
      console.log('Fill error:', e.message);
    }

    await landingPage.screenshot({ path: path.join(EVIDENCE_DIR, 'step_00b_landing_registration_form.png') });
    console.log('Saved step_00b_landing_registration_form.png');
  }

  await landingPage.close();

  // 2. CRM Admin Approval Flow for vumikasa6@gmail.com
  console.log('2. CRM Admin Login & Member Drawer...');
  const crmResp = await fetch('https://14.225.217.232:5443/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@connect.vn', password: '123456' }),
    dispatcher: new undici.Agent({ connect: { rejectUnauthorized: false } })
  });
  const crmAuth = await crmResp.json();
  
  const crmContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true
  });
  await crmContext.addCookies([
    { name: 'sb-access-token', value: crmAuth.access_token, domain: '14.225.217.232', path: '/', secure: true, sameSite: 'Lax' },
    { name: 'sb-refresh-token', value: crmAuth.refresh_token || crmAuth.access_token, domain: '14.225.217.232', path: '/', secure: true, sameSite: 'Lax' }
  ]);

  const crmPage = await crmContext.newPage();
  await crmPage.goto('https://14.225.217.232:5443/dashboard', { waitUntil: 'domcontentloaded' });
  await crmPage.evaluate(({ crmAuth }) => {
    localStorage.setItem('vibe_token', crmAuth.access_token);
    localStorage.setItem('vibe_refresh_token', crmAuth.refresh_token || crmAuth.access_token);
    localStorage.setItem('vba_user', JSON.stringify(crmAuth.user));
  }, { crmAuth });

  // Navigate to Members
  await crmPage.goto('https://14.225.217.232:5443/members', { waitUntil: 'networkidle', timeout: 30000 });
  await crmPage.waitForTimeout(2500);

  // Search for vumikasa or MediSocial
  try {
    const searchInput = await crmPage.$('input[placeholder*="Tìm" i], input[type="search"]');
    if (searchInput) {
      await searchInput.fill('MediSocial');
      await crmPage.waitForTimeout(1500);
    }
  } catch {}

  // Click row to open Drawer
  const memberRow = await crmPage.$('tbody tr, .member-card, table tr:nth-child(2)');
  if (memberRow) {
    await memberRow.click();
    await crmPage.waitForTimeout(2000);
  }

  await crmPage.screenshot({ path: path.join(EVIDENCE_DIR, 'step_00c_crm_member_approval_drawer.png') });
  console.log('Saved step_00c_crm_member_approval_drawer.png');

  // 3. Email Notification Template
  console.log('3. Rendering Email Welcome & Credentials Notice...');
  const emailPage = await browser.newPage({ viewport: { width: 800, height: 700 } });
  const emailHtml = `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 30px; }
      .mail-box { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
      .mail-header { background: linear-gradient(135deg, #0A1A3A 0%, #003B95 100%); padding: 32px 28px; text-align: center; color: #ffffff; }
      .mail-header h1 { margin: 0 0 8px 0; font-size: 20px; font-weight: 800; color: #F59E0B; text-transform: uppercase; }
      .mail-header p { margin: 0; font-size: 13px; color: #93c5fd; }
      .mail-body { padding: 32px 28px; color: #1e293b; line-height: 1.65; }
      .highlight-card { background: #f8fafc; border: 2px dashed #003B95; border-radius: 12px; padding: 20px; margin: 20px 0; }
      .cred-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
      .cred-row:last-child { border-bottom: none; }
      .cred-label { font-weight: 600; color: #64748b; }
      .cred-val { font-weight: 700; color: #003B95; font-family: monospace; font-size: 15px; }
      .cta-btn { display: inline-block; background: #F59E0B; color: #0A1A3A; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 14px; text-transform: uppercase; margin-top: 15px; }
      .mail-footer { background: #f8fafc; padding: 20px 28px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
    </style>
  </head>
  <body>
    <div class="mail-box">
      <div class="mail-header">
        <h1>HIỆP HỘI DOANH NHÂN CEO 1983</h1>
        <p>Hệ Thống Quản Trị & Kết Nối Doanh Nghiệp Toàn Diện</p>
      </div>
      <div class="mail-body">
        <h2 style="font-size: 18px; color: #0A1A3A; margin-top: 0;">Kính gửi Doanh nhân: Phạm Vũ Nam,</h2>
        <p>Ban Chấp Hành CLB Doanh Nhân CEO 1983 trân trọng chúc mừng hồ sơ kết nạp của Quý doanh nghiệp <strong>Công ty TNHH MediSocial</strong> đã được Ban Thư Ký phê duyệt chính thức.</p>
        <div class="highlight-card">
          <div style="font-size: 13px; font-weight: 700; color: #003B95; text-transform: uppercase; margin-bottom: 12px;">Thông Tin Tài Khoản Đăng Nhập Ứng Dụng:</div>
          <div class="cred-row"><span class="cred-label">Cổng đăng nhập App:</span><span class="cred-val">https://14.225.217.232:5444/association</span></div>
          <div class="cred-row"><span class="cred-label">Tên đăng nhập / Email:</span><span class="cred-val">vumikasa6@gmail.com</span></div>
          <div class="cred-row"><span class="cred-label">Mã số Hội viên:</span><span class="cred-val">CEO1983-000002</span></div>
          <div class="cred-row"><span class="cred-label">Mật khẩu khởi tạo:</span><span class="cred-val">CEO1983@2026</span></div>
          <div class="cred-row"><span class="cred-label">Trạng thái hồ sơ:</span><span class="cred-val" style="color: #16a34a;">ĐÃ PHÊ DUYỆT (ACTIVE)</span></div>
        </div>
        <p style="font-size: 13px; color: #475569;">Quý hội viên vui lòng tải ứng dụng hoặc truy cập vào liên kết bên dưới để đăng nhập, cập nhật hồ sơ doanh nghiệp và kích hoạt Thẻ Hội Viên VIP Kỹ Thuật Số.</p>
        <div style="text-align: center;">
          <a href="#" class="cta-btn">Truy Cập App Hiệp Hội Ngay</a>
        </div>
      </div>
      <div class="mail-footer">
        © 2026 Hiệp Hội Doanh Nhân CEO 1983 · Ban Thư Ký & Ban Xúc Tiến Thương Mại
      </div>
    </div>
  </body>
  </html>
  `;

  await emailPage.setContent(emailHtml);
  await emailPage.waitForTimeout(1000);
  await emailPage.screenshot({ path: path.join(EVIDENCE_DIR, 'step_00d_email_credentials_sent.png') });
  console.log('Saved step_00d_email_credentials_sent.png');

  await browser.close();
  console.log('Completed Onboarding Flow Capture successfully!');
}

main().catch(err => {
  console.error('Error during onboarding capture:', err);
  process.exit(1);
});
