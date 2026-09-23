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

// BẬT CHẾ ĐỘ LIVE DEV SERVER (Tự động cập nhật UI mới nhất khi đẩy code lên server)
const USE_REMOTE_SERVER = true;

// Cấu hình URL server dev cho ViOne Connect (100% HTTPS Cổng 5445):
const REMOTE_URL = 'https://14.225.217.232:5445/connect-app';

// Cho phép cleartext khi cần tải tài nguyên phụ
const CLEARTEXT = true;

const config: CapacitorConfig = {
  appId: 'ViOneBusinessConnect',
  appName: 'ViOne Connect',

  // Web assets directory fallback
  webDir: 'www',

  ...(USE_REMOTE_SERVER
    ? {
        server: {
          url: REMOTE_URL,
          cleartext: CLEARTEXT,
          androidScheme: 'https',
          allowNavigation: [
            '14.225.217.232*',
            '14.225.217.232:5445*',
            '*.14-225-217-232.sslip.io*',
            '*.sslip.io*',
            'vione.vn*',
            '*.vione.vn*'
          ]
        }
      }
    : {})
};

export default config;

