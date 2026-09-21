import type { CapacitorConfig } from '@capacitor/cli';

/**
 * =========================================================================
 * VIONE MOBILE - CẤU HÌNH CAPACITOR THEO MÔI TRƯỜNG
 * =========================================================================
 *
 * [CHẾ ĐỘ HIỆN TẠI] DEV LIVE SERVER:
 * - Đang bật `server.url` trỏ về IP Dev (14.225.217.232:5000).
 * - Sửa giao diện/logic FE chỉ cần deploy lên server dev là APK tự đổi, không cần build lại.
 *
 * [HƯỚNG A] ĐÓNG GÓI TĨNH STANDALONE / OFFLINE:
 * - Đổi `USE_REMOTE_SERVER = false` bên dưới (hoặc comment khối server).
 * - Chạy: `npm run build:static` (hoặc build FE rồi chạy `npx cap sync android`).
 * - Mở Android Studio build lại file APK. Toàn bộ code sẽ nằm cố định trong APK.
 *
 * [HƯỚNG B] PRODUCTION QUA DOMAIN HTTPS CHÍNH THỨC:
 * - Đổi `USE_REMOTE_SERVER = true`.
 * - Đổi `REMOTE_URL` thành domain production chính thức có SSL (ví dụ: 'https://app.vione.vn').
 * - Đổi `CLEARTEXT = false`.
 * =========================================================================
 */

// CẤU HÌNH LIVE SERVER: Mở trực tiếp App Hiệp Hội CEO 1983 chuẩn
const USE_REMOTE_SERVER = true;

// URL Cổng Web chính thức của Phân hệ Hiệp hội CLB Doanh Nhân CEO 1983 (100% HTTPS Cổng 5444)
export const REMOTE_URL = 'https://14.225.217.232:5444/association';
export const WEB_PORTAL_URL = 'https://14.225.217.232:5444/association';

// Chạy 100% bảo mật HTTPS
const CLEARTEXT = false;

const config: CapacitorConfig = {
  appId: 'vn.ceo1983.app',
  appName: 'CEO 1983',

  // Thư mục chứa gói web bundle tĩnh
  webDir: 'www',

  server: {
    url: USE_REMOTE_SERVER ? REMOTE_URL : undefined,
    androidScheme: 'https',
    cleartext: CLEARTEXT,
    allowNavigation: [
      '14.225.217.232*',
      '14.225.217.232:5444*',
      '*.14-225-217-232.sslip.io*',
      '*.sslip.io*',
      'ceo1983.com*',
      '*.ceo1983.com*',
      'api.qrserver.com*'
    ]
  }
};

export default config;

