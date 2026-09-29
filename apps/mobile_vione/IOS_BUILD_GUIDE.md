# Hướng Dẫn Build & Xuất Bản Mobile ViOne (Android APK & iOS App Store Connect)

Tài liệu này hướng dẫn chi tiết quy trình xuất file **Android APK** và bản build **iOS (TestFlight / App Store Connect)** cho dự án **ViOne**, đồng bộ chính xác 100% với cấu hình hệ thống thực tế:

- **Tên App trên Apple App Store**: `Vione` (Tên hiển thị trên máy: `Vione Business Connect`)
- **Bundle Identifier**: `ViOneBusinessConnect`
- **Apple ID (App Store Connect ID)**: `6810608093`
- **SKU**: `vione-app`
- **Tài khoản Expo**: `unicom-vibe-coding-team`
- **Expo Project**: `@unicom-vibe-coding-team/vione` (Project ID: `3b83c509-f641-4560-a8e5-33dfd5940f89`)

---

## ⭐️ KIẾN TRÚC MỚI: REACT NATIVE NATIVE APP (EXPO SDK 52)

Ứng dụng **ViOne Mobile** đã được nâng cấp và chuyển đổi hoàn toàn sang **Pure Native React Native App** (Expo SDK 52) với trải nghiệm mượt mà, tối ưu camera quét QR và bảo mật sinh trắc học:

- **Mã nguồn ứng dụng**: Nằm trực tiếp tại [apps/mobile_vione/src](file:///d:/download/VICONNECT/CEO_VIONE_PROJECT/vione_project/apps/mobile_vione/src).
- **Phát triển cục bộ (Hot Reload)**: Chạy `npm run dev:mobile` (hoặc `cd apps/mobile_vione && npx expo start`), quét mã QR bằng Expo Go hoặc thiết bị Android/iOS để kiểm thử tức thì.
- **Biên dịch Native**:
  - Android APK: `npm run build:apk` (hoặc `.\build-apk.ps1`)
  - iOS IPA (TestFlight): `npm run build:ipa` (hoặc `.\build-ipa.ps1`)
- **API Backend**: Kết nối trực tiếp tới NestJS API (`https://14.225.217.232:5445/api` hoặc local proxy).

---

## 1. Các Đường Link Quan Trọng (Dashboards & Tải Sản Phẩm)

- **Trang theo dõi tiến trình Build & Tải trực tiếp file `.ipa`**:
  👉 [EAS Builds Dashboard](https://expo.dev/accounts/unicom-vibe-coding-team/projects/vione/builds)
- **Trang quản lý TestFlight & App Store Connect**:
  👉 [App Store Connect TestFlight](https://appstoreconnect.apple.com/apps/6810608093/testflight/ios)
- **File IPA Build 4 (Mới nhất - Đang xử lý trên TestFlight)**:
  👉 [Download Build 4 .IPA (Direct Link)](https://expo.dev/artifacts/eas/BaxacCwYnCr_yU9AIMjrcOtJC48VYaAG3jaJnoa3Wcc.ipa)
- **File IPA Build 3 (Đã phát hành TestFlight trước đó)**:
  👉 [Download Build 3 .IPA](https://expo.dev/artifacts/eas/-BMmwAUQczehQxzZYWV6fMMSYQH5k5zKy7hTKhLKpzA.ipa)
- **File Android APK Debug cục bộ (Đã build sẵn)**:
  👉 `apps/mobile_vione/android/app/build/outputs/apk/debug/ViOne-Connect-v1.0-debug.apk`

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

