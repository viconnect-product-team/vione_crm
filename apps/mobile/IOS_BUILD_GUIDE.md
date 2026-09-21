# Hướng Dẫn Build & Xuất Bản Mobile ViOne (Android APK & iOS App Store Connect)

Tài liệu này hướng dẫn chi tiết quy trình xuất file **Android APK** và bản build **iOS (TestFlight / App Store Connect)** cho dự án **ViOne**, đồng bộ chính xác 100% với cấu hình hệ thống thực tế:

- **Tên App trên Apple App Store**: `Vione` (Tên hiển thị trên máy: `Vione Business Connect`)
- **Bundle Identifier**: `ViOneBusinessConnect`
- **Apple ID (App Store Connect ID)**: `6810608093`
- **SKU**: `vione-app`
- **Tài khoản Expo**: `unicom-vibe-coding-team`
- **Expo Project**: `@unicom-vibe-coding-team/vione` (Project ID: `3b83c509-f641-4560-a8e5-33dfd5940f89`)

---

## ⭐️ LƯU Ý QUAN TRỌNG NHẤT: KHI NÀO CẦN BUILD APP?

Ứng dụng Mobile ViOne chạy ở chế độ **Live Remote Server** ([capacitor.config.ts](file:///d:/download/VICONNECT/VIONE_PROJECT/vione_app/apps/mobile/capacitor.config.ts)):
```ts
const USE_REMOTE_SERVER = true;
const REMOTE_URL = 'http://14.225.217.232:5000';
```

- **Khi sửa UI / Logic Frontend**: **KHÔNG CẦN BUILD LẠI FILE NATIVE!**
  Bạn chỉ cần deploy bản web frontend lên máy chủ `14.225.217.232:5000` (chạy script `fast-deploy.ps1`). App trên điện thoại tự động cập nhật ngay khi mở lại.
- **Chỉ cần build lại file .ipa / .apk khi**:
  1. Đổi Icon app hoặc màn hình chờ Splash screen.
  2. Tích hợp thư viện Native mới (Push notification, Bluetooth, NFC, In-app purchase,...).
  3. Đổi địa chỉ URL máy chủ (ví dụ: chuyển từ IP sang domain chính thức `https://app.vione.vn`).
  4. Nâng version lớn để phát hành chính thức lên App Store / Google Play.

---

## 1. Các Đường Link Quan Trọng (Dashboards & Tải Sản Phẩm)

- **Trang theo dõi tiến trình Build & Tải trực tiếp file `.ipa`**:
  👉 [EAS Builds Dashboard](https://expo.dev/accounts/unicom-vibe-coding-team/projects/vione/builds)
- **Trang quản lý TestFlight & App Store Connect**:
  👉 [App Store Connect TestFlight](https://appstoreconnect.apple.com/apps/6810608093/testflight/ios)
- **File IPA Build 3 (Đã hoàn tất & Đang hoạt động trên TestFlight)**:
  👉 [Download Build 3 .IPA](https://expo.dev/artifacts/eas/-BMmwAUQczehQxzZYWV6fMMSYQH5k5zKy7hTKhLKpzA.ipa)
- **File Android APK Debug cục bộ (Đã build sẵn)**:
  👉 `apps/mobile/android/app/build/outputs/apk/debug/ViOne-Connect-v1.0-debug.apk`

---

## 2. Thông Tin Xác Thực Apple & Expo (Không Hỏi Mật Khẩu)

- **App Store Connect API Key ID**: `4Q734PS4PG`
- **Issuer ID**: `6c7d5137-21b1-4bae-96d2-3cc761483dbc`
- **File Private Key cục bộ**: `apps/mobile/credentials/AuthKey_4Q734PS4PG.p8` (đã được bảo vệ trong `.gitignore`)
- **Tài khoản Apple Developer**: `tuanna@unicomhub.com`
- Nhờ API Key này, bạn **không bao giờ phải nhập mật khẩu Apple ID hoặc mã xác thực OTP 2FA** khi build hoặc submit.

---

## 3. Quy Trình & Lệnh Build iOS Production Lên TestFlight

### Yêu Cầu Bắt Buộc Của Apple (Chính Sách 2026)
- **Bắt buộc dùng Xcode 26 & iOS 26 SDK**: File `eas.json` đã cấu hình `"image": "macos-sequoia-15.6-xcode-26.2"`.
- **Bỏ qua script C++ node-gyp**: File `.npmrc` đã có `ignore-scripts=true`.
- **Bỏ qua câu hỏi mã hóa trên TestFlight**: File `Info.plist` đã có `<key>ITSAppUsesNonExemptEncryption</key><false/>`.

### Các Lệnh Chạy (Tại thư mục `apps/mobile`):

#### Cách 1: Tự động Trọn Gói: Build .IPA rồi Auto-Submit lên TestFlight (Khuyên dùng nhất)
```powershell
cd apps/mobile
npx eas-cli build --profile production --platform ios --auto-submit --non-interactive
```

#### Cách 2: Chỉ Build file .IPA (Để tải về máy hoặc lưu trữ)
```powershell
cd apps/mobile
npx eas-cli build --profile production --platform ios --non-interactive
```

#### Cách 3: Đẩy bản build IPA mới nhất lên Apple TestFlight
```powershell
cd apps/mobile
npx eas-cli submit -p ios --latest --non-interactive
```

---

## 4. Quy Trình & Lệnh Build Android (Cục Bộ)

Chạy tại thư mục `apps/mobile`:

#### Bước 1: Đồng bộ cấu hình
```powershell
cd apps/mobile
npx cap sync android
```

#### Bước 2: Biên dịch file APK / AAB
- **Build APK Debug (Cài ngay vào điện thoại Android cá nhân)**:
  ```powershell
  cd apps/mobile/android
  .\gradlew assembleDebug
  ```
  *Vị trí file APK sau khi xong:*
  `apps/mobile/android/app/build/outputs/apk/debug/ViOne-Connect-v1.0-debug.apk`

- **Build APK / AAB Release (Phát hành Google Play)**:
  ```powershell
  cd apps/mobile/android
  .\gradlew assembleRelease
  ```
  *Vị trí file sau khi xong:*
  `apps/mobile/android/app/build/outputs/apk/release/`
  `apps/mobile/android/app/build/outputs/bundle/release/`

---

## 5. Bảng Tổng Hợp Lệnh Nhanh

| Mục tiêu | Thư mục chạy | Lệnh | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Build & Nộp TestFlight (iOS)** | `apps/mobile` | `npx eas-cli build --profile production --platform ios --auto-submit --non-interactive` | Chạy 1 lệnh duy nhất, tự build và tự đẩy lên Apple |
| **Build file .IPA (iOS)** | `apps/mobile` | `npx eas-cli build --profile production --platform ios --non-interactive` | Build cloud macOS, tải file IPA tại EAS Dashboard |
| **Nộp IPA lên TestFlight** | `apps/mobile` | `npx eas-cli submit -p ios --latest --non-interactive` | Submit bản build mới nhất lên App Store Connect |
| **Build APK Debug (Android)** | `apps/mobile/android` | `.\gradlew assembleDebug` | Biên dịch siêu tốc cục bộ trên Windows |
| **Đồng bộ code sang Android** | `apps/mobile` | `npx cap sync android` | Cập nhật file cấu hình và web sang thư mục android |
| **Kiểm tra đăng nhập Expo** | `apps/mobile` | `npx eas-cli whoami` | Kiểm tra tài khoản EAS |

