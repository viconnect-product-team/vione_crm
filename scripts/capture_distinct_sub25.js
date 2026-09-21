const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const app = await browser.newPage({ viewport: { width: 390, height: 844 } });
  
  await app.goto('http://14.225.217.232:5002/association/login', { waitUntil: 'networkidle' });
  await app.locator('#assoc-auth-id').fill('ceo.tongthuky@ceo1983.com');
  await app.locator('#assoc-auth-password').fill('123456');
  await app.locator('form button[type="submit"]').click();
  await app.waitForTimeout(2500);

  await app.goto('http://14.225.217.232:5002/association/messages?peerCode=M1983-002&peerName=Trần%20Quốc%20Bảo', { waitUntil: 'networkidle' });
  await app.waitForTimeout(2000);

  // Type a message in input box
  const input = app.locator('input[placeholder*="tin nhắn"], textarea[placeholder*="tin nhắn"], input[type="text"]').last();
  if (await input.count() > 0) {
    await input.fill('Chào anh Bảo, tôi gửi lại thông tin dự án đính kèm nhé.');
    await app.waitForTimeout(500);
  }

  const buf = await app.screenshot();
  fs.writeFileSync('document/images/evidence/sub_25_app_chat_recalled_msg.png', buf);
  fs.writeFileSync('apps/vione_app_fe/public/docs/images/evidence/sub_25_app_chat_recalled_msg.png', buf);
  console.log('Saved distinct sub_25:', buf.length, 'bytes');

  await browser.close();
})();
