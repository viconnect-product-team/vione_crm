const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  
  try {
    // 1. CRM
    console.log('Testing CRM 5000...');
    const pageCrm = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await pageCrm.goto('http://14.225.217.232:5000/', { waitUntil: 'networkidle', timeout: 20000 });
    console.log('CRM Current URL:', pageCrm.url());
    console.log('CRM Title:', await pageCrm.title());
    await pageCrm.screenshot({ path: path.join(__dirname, 'test_crm_home.png') });

    // Try CRM /auth
    await pageCrm.goto('http://14.225.217.232:5000/auth', { waitUntil: 'networkidle', timeout: 20000 });
    console.log('CRM /auth URL:', pageCrm.url());
    await pageCrm.screenshot({ path: path.join(__dirname, 'test_crm_auth.png') });

    // 2. Association App
    console.log('Testing App 5002...');
    const pageApp = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await pageApp.goto('http://14.225.217.232:5002/association', { waitUntil: 'networkidle', timeout: 20000 });
    console.log('App Current URL:', pageApp.url());
    console.log('App Title:', await pageApp.title());
    await pageApp.screenshot({ path: path.join(__dirname, 'test_app_home.png') });

    // App /association/login
    await pageApp.goto('http://14.225.217.232:5002/association/login', { waitUntil: 'networkidle', timeout: 20000 });
    console.log('App /login URL:', pageApp.url());
    await pageApp.screenshot({ path: path.join(__dirname, 'test_app_login.png') });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

main();
