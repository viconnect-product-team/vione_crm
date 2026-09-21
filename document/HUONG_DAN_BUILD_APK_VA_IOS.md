# Hướng Dẫn Toàn Diện: Build & Xuất Bản Android APK và iOS IPA (TestFlight)
**Dự án:** ViOne Ecosystem (ViOne Connect & Hiệp Hội Doanh Nhân CEO 1983)  
**Môi trường phát triển:** Windows 11, Node.js v24, Java JDK 21, Expo EAS Cloud, Capacitor Native Bridge.

---

## ⭐️ 1. NGUYÊN TẮC CỐT LÕI: KHI NÀO CẦN BUILD NATIVE APP?

Hệ thống Mobile của ViOne được kiến trúc theo mô hình **Hybrid Live Remote Server**:
- File native wrapper (Android / iOS) hoạt động như một shell bản địa hiệu năng cao, trỏ trực tiếp đến máy chủ backend/frontend (`https://14.225.217.232:5444/connect-app` hoặc `https://14.225.217.232:5444/association`).
- Khi bạn cập nhật giao diện (UI), sửa lỗi, đổi màu sắc, thêm chức năng CRM hay đổi API:
  👉 **BẠN KHÔNG CẦN BUILD LẠI FILE APK / IPA!**
  👉 Bạn chỉ cần triển khai bản web lên máy chủ (chạy file script `fast-deploy.ps1` hoặc `deploy-all.ps1`). Toàn bộ người dùng trên điện thoại sẽ tự động nhận giao diện và tính năng mới ngay khi mở ứng dụng.

### Khi nào BẮT BUỘC phải build lại file .APK / .IPA?
1. Thay đổi **Icon ứng dụng** hoặc **màn hình chờ (Splash screen)**.
2. Tích hợp hoặc nâng cấp các plugin phần cứng Native (NFC thẻ kim loại, Camera quét QR, FaceID / TouchID, Bluetooth, Push Notification).
3. Chuyển đổi tên miền máy chủ chính thức (ví dụ: chuyển từ IP sang `https://app.vione.vn` hoặc `https://app.ceo1983.vn`).
4. Nâng version code / build number để phát hành chính thức lên **Google Play Store** hoặc **Apple App Store**.

---

## 📱 2. CẤU TRÚC 2 ỨNG DỤNG MOBILE TRONG HỆ THỐNG

Monorepo quản lý độc lập 2 ứng dụng tương ứng với 2 tệp khách hàng:

| Thông tin | Ứng Dụng 1: ViOne Connect | Ứng Dụng 2: Hiệp Hội CEO 1983 |
| :--- | :--- | :--- |
| **Thư mục mã nguồn** | `apps/mobile_vione` | `apps/mobile_ceo1983` |
| **Tên hiển thị trên điện thoại** | `ViOne Connect` | `CEO 1983` |
| **Package ID Android** | `com.vione.app` | `vn.ceo1983.app` |
| **Bundle Identifier iOS** | `ViOneBusinessConnect` | `vn.ceo1983.app` |
| **URL khởi động mặc định** | `https://14.225.217.232:5444/connect-app` | `https://14.225.217.232:5444/association` |
| **Tính năng phần cứng** | Thẻ Titanium NFC, QR Code, File chooser | Thẻ Hội viên NFC, QR Check-in, File chooser |

---

## 🤖 3. HƯỚNG DẪN BUILD ANDROID APK

Có 2 phương thức xuất file APK tùy theo nhu cầu:

### Phương thức A: Build Cục Bộ Siêu Tốc (Khuyên dùng để thử nghiệm cài ngay)
Phương thức này biên dịch trực tiếp trên máy Windows thông qua Java JDK 21 và Gradle Wrapper đã tích hợp sẵn. Thời gian build chỉ từ **30 giây - 1.5 phút**.

#### 1. Lệnh thực thi từ thư mục gốc dự án:
```powershell
# Build APK cho App ViOne Connect:
npm run mobile:vione:apk:local

# Build APK cho App Hiệp Hội CEO 1983:
npm run mobile:ceo1983:apk:local
```

#### 2. Hoặc thực thi trực tiếp trong thư mục mobile:
```powershell
# Cho ViOne Connect:
cd apps/mobile_vione
npx cap copy android
cd android
.\gradlew.bat assembleDebug

# Cho CEO 1983:
cd apps/mobile_ceo1983
npx cap copy android
cd android
.\gradlew.bat assembleDebug
```
> **Lưu ý sống còn:** Khi sửa file `capacitor.config.ts` (ví dụ đổi URL hay đổi thông tin App), BẮT BUỘC phải chạy `npx cap copy android` trước khi chạy `gradlew.bat` để Capacitor nạp cấu hình mới nhất vào `android/app/src/main/assets/capacitor.config.json`. Nếu dùng script `npm run mobile:ceo1983:apk:local`, hệ thống đã tự động chạy bước đồng bộ này.

#### 3. Vị trí nhận file APK sau khi hoàn tất:
- **ViOne Connect:**  
  👉 `apps/mobile_vione/android/app/build/outputs/apk/debug/ViOne-Connect-v1.0-debug.apk`
- **CEO 1983:**  
  👉 `apps/mobile_ceo1983/android/app/build/outputs/apk/debug/CEO1983-v1.0-debug.apk`

> **Cách cài đặt:** Copy file `.apk` vào điện thoại Android qua dây cáp USB, hoặc gửi qua Zalo / Telegram / Google Drive rồi nhấn cài đặt trực tiếp.

---

### Phương thức B: Build qua Đám Mây Expo EAS (Nhận Link Tải & Mã QR Online)
Phương thức này gửi mã nguồn lên server đám mây EAS, tự động biên dịch và tạo đường link web để bất kỳ ai trong ban giám đốc đều có thể quét mã QR cài đặt mà không cần cắm cáp.

#### Lệnh thực thi từ thư mục gốc:
```powershell
# Build APK Cloud cho ViOne Connect:
npm run mobile:vione:apk

# Build APK Cloud cho CEO 1983:
npm run mobile:ceo1983:apk
```

---

## 🍏 4. HƯỚNG DẪN BUILD iOS IPA & TESTFLIGHT

Do dự án phát triển trên môi trường **Windows**, chúng ta sử dụng hệ thống máy ảo macOS Sequoia (chạy **Xcode 26.2** chuẩn Apple mới nhất) trên hạ tầng **Expo Application Services (EAS Cloud)**.

### Thông tin Chứng chỉ & Tài khoản Apple (Đã cấu hình tự động):
- **Apple Developer API Key ID**: `4Q734PS4PG`
- **Issuer ID**: `6c7d5137-21b1-4bae-96d2-3cc761483dbc`
- **Tài khoản App Store Connect**: `tuanna@unicomhub.com`
- **App ID trên Apple**: `6810608093`
- *Ưu điểm:* Bạn **không bao giờ phải nhập mật khẩu hay mã OTP 2FA** của Apple ID khi chạy lệnh.

---

### Phương thức A: Tự Động Toàn Trình: Build IPA rồi Đẩy Thẳng Lên Apple TestFlight (Khuyên Dùng Nhất)
Lệnh này sẽ tự động:
1. Đóng gói mã nguồn native iOS.
2. Gửi lên máy chủ macOS để biên dịch và ký chứng chỉ Apple Distribution.
3. Xuất file `.ipa` chuẩn App Store.
4. Tự động submit lên **Apple TestFlight**.

#### Lệnh thực thi từ thư mục gốc:
```powershell
# Build & Đẩy TestFlight cho ViOne Connect:
npm run mobile:vione:testflight

# Build & Đẩy TestFlight cho CEO 1983:
npm run mobile:ceo1983:testflight
```
*(Hoặc vào thư mục `apps/mobile_vione` và gõ `npm run build:ios:submit`)*

Sau khoảng 10 - 15 phút biên dịch trên đám mây, Apple sẽ gửi email thông báo và app xuất hiện trên ứng dụng **TestFlight** trên iPhone của bạn.

---

### Phương thức B: Chỉ Build File `.IPA` Để Tải Về Máy
Nếu bạn chỉ muốn tải file `.ipa` về lưu trữ hoặc cài đặt qua các công cụ nội bộ (như AltStore, 3uTools):

#### Lệnh thực thi từ thư mục gốc:
```powershell
# Build file IPA cho ViOne Connect:
npm run mobile:vione:ipa

# Build file IPA cho CEO 1983:
npm run mobile:ceo1983:ipa
```

- **Theo dõi tiến trình và tải file trực tiếp tại Dashboard:**  
  👉 [EAS Builds Dashboard - ViOne Project](https://expo.dev/accounts/unicom-vibe-coding-team/projects/vione/builds)
- **Tải trực tiếp file `.IPA` ViOne Build 4 mới nhất:**  
  👉 [Download ViOne-Build-4.ipa](https://expo.dev/artifacts/eas/BaxacCwYnCr_yU9AIMjrcOtJC48VYaAG3jaJnoa3Wcc.ipa)
- **Quản lý phiên bản trên TestFlight:**  
  👉 [App Store Connect TestFlight Portal](https://appstoreconnect.apple.com/apps/6810608093/testflight/ios)

---

## ⚡️ 5. BẢNG TRA CỨU NHANH TẤT CẢ CÁC LỆNH

Bạn chỉ cần mở Terminal tại thư mục gốc `vione_app` và chạy các lệnh tiện ích sau:

| Thao tác mong muốn | Lệnh chạy tại thư mục gốc | Thời gian | Kết quả đầu ra |
| :--- | :--- | :--- | :--- |
| **Build APK ViOne (Cài ngay)** | `npm run mobile:vione:apk:local` | ~45s | File APK nằm tại thư mục debug |
| **Build APK CEO 1983 (Cài ngay)** | `npm run mobile:ceo1983:apk:local` | ~45s | File APK nằm tại thư mục debug |
| **Build APK ViOne (Cloud QR)** | `npm run mobile:vione:apk` | ~4-6 phút | Link web tải APK trực tiếp |
| **Build APK CEO 1983 (Cloud QR)**| `npm run mobile:ceo1983:apk` | ~4-6 phút | Link web tải APK trực tiếp |
| **Build & Nộp ViOne lên TestFlight**| `npm run mobile:vione:testflight` | ~10-15 phút | Tự động có trên TestFlight iPhone |
| **Build & Nộp CEO1983 lên TestFlight**| `npm run mobile:ceo1983:testflight` | ~10-15 phút | Tự động có trên TestFlight iPhone |
| **Chỉ xuất file IPA ViOne (iOS)** | `npm run mobile:vione:ipa` | ~10 phút | File `.ipa` tải từ EAS Dashboard |
| **Chỉ xuất file IPA CEO 1983 (iOS)**| `npm run mobile:ceo1983:ipa` | ~10 phút | File `.ipa` tải từ EAS Dashboard |

---

## 🛠 6. XỬ LÝ SỰ CỐ THƯỜNG GẶP (TROUBLESHOOTING)

### 1. Chưa đăng nhập tài khoản Expo EAS trên máy:
Nếu báo lỗi `Authentication with EAS failed`:
```powershell
npx eas-cli login
```
Nhập tài khoản Expo của team: `unicom-vibe-coding-team`.

### 2. Muốn chuyển app sang chạy Offline hoàn toàn (Không phụ thuộc mạng Server Dev):
Mở file `capacitor.config.ts` trong thư mục app tương ứng:
1. Đổi `const USE_REMOTE_SERVER = false;`
2. Chạy `npm run build:static`
3. Tiến hành build lại APK / IPA.
Toàn bộ mã nguồn web sẽ được nhúng cứng vào file cài đặt native.
