# Hướng Dẫn Build & Xuất Bản Mobile CEO 1983 (Android APK & iOS App Store Connect)

Tài liệu này hướng dẫn chi tiết quy trình xuất file **Android APK** và bản build **iOS (TestFlight / App Store Connect)** cho ứng dụng **Hiệp Hội Doanh Nhân CEO 1983**, đồng bộ chính xác 100% với cấu hình hệ thống:

- **Tên App trên Apple / Android**: `CEO 1983` (Hiệp hội Doanh nhân CEO 1983)
- **Bundle Identifier iOS**: `vn.ceo1983.app`
- **Package Name Android**: `vn.ceo1983.app`
- **Tài khoản Expo / EAS**: `unicom-vibe-coding-team`
- **Start URL trên Server**: `https://14.225.217.232:5444/association`

---

## ⭐️ LƯU Ý QUAN TRỌNG: KHI NÀO CẦN BUILD APP?

Ứng dụng Mobile CEO 1983 chạy ở chế độ **Live Remote Server** (`capacitor.config.ts`):
```ts
const USE_REMOTE_SERVER = true;
const REMOTE_URL = 'https://14.225.217.232:5444/association';
```

- **Khi sửa UI / Logic Frontend / Sửa tính năng**: **KHÔNG CẦN BUILD LẠI NATIVE!**
  Bạn chỉ cần deploy bản web frontend lên máy chủ qua script `fast-deploy.ps1`. App trên điện thoại tự động cập nhật phiên bản mới nhất ngay khi mở app.
- **Chỉ cần build lại file .apk / .ipa khi**:
  1. Đổi Logo icon hoặc màn hình chờ Splash screen.
  2. Tích hợp plugin phần cứng Native mới (Camera scan QR, NFC, Push Notification,...).
  3. Đổi địa chỉ máy chủ (ví dụ chuyển sang domain production chính thức có SSL `https://app.ceo1983.vn`).
  4. Nâng version code khi xuất bản chính thức lên Google Play & Apple App Store.

---

## 1. Hướng Dẫn Build Android APK

### Cách 1: Build siêu tốc cục bộ trên máy tính (Khuyên dùng thử nghiệm)
Chạy trực tiếp từ thư mục gốc hoặc thư mục mobile:
```powershell
# Từ thư mục gốc dự án:
npm run mobile:ceo1983:apk:local

# Hoặc vào trực tiếp thư mục android:
cd apps/mobile_ceo1983/android
.\gradlew.bat assembleDebug
```
- **Vị trí file APK sau khi hoàn tất:**
  `apps/mobile_ceo1983/android/app/build/outputs/apk/debug/CEO1983-v1.0-debug.apk`
- **Cách cài:** Copy file này vào điện thoại Android hoặc gửi qua Zalo / Telegram để cài đặt trực tiếp.

### Cách 2: Build APK qua đám mây EAS (Có link tải trực tuyến)
```powershell
cd apps/mobile_ceo1983
npx eas-cli build --profile preview --platform android
```
- Hệ thống đám mây sẽ biên dịch và cấp link quét QR / tải trực tiếp APK về điện thoại.

---

## 2. Hướng Dẫn Build iOS (.IPA & TestFlight)

Do đang phát triển trên máy tính Windows, quy trình build iOS được thực hiện thông qua **EAS Cloud** (sử dụng container macOS Sequoia và Xcode 26 mới nhất, không cần mua máy Mac):

### Cách 1: Tự động Build và Submit thẳng lên Apple TestFlight
```powershell
cd apps/mobile_ceo1983
npx eas-cli build --profile production --platform ios --auto-submit --non-interactive
```
- Hệ thống tự động ký số bằng Apple Developer API Key (đã cấu hình sẵn, không hỏi OTP / 2FA).
- Sau khi build xong, bản build tự động xuất hiện trên Apple TestFlight để các thành viên ban điều hành cài đặt kiểm thử.

### Cách 2: Chỉ Build file .IPA (để tải về lưu trữ)
```powershell
cd apps/mobile_ceo1983
npx eas-cli build --profile production --platform ios --non-interactive
```

---

## 3. Bảng Tổng Hợp Lệnh Nhanh

| Mục tiêu | Lệnh tại thư mục gốc | Ghi chú |
| :--- | :--- | :--- |
| **Build APK CEO 1983 (Cục bộ)** | `npm run mobile:ceo1983:apk:local` | 1 phút, file nằm trong thư mục output debug |
| **Build APK CEO 1983 (Cloud)** | `npm run mobile:ceo1983:apk` | Nhận link tải trực tuyến từ EAS |
| **Build & Nộp TestFlight iOS** | `npm run mobile:ceo1983:testflight` | Tự động build và gửi lên TestFlight |
| **Build file .IPA iOS** | `npm run mobile:ceo1983:ipa` | Xuất file .ipa tải từ Dashboard |
