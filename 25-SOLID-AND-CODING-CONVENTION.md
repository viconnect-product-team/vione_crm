# QUY ƯỚC VIẾT CODE & THIẾT KẾ SOLID DỰ ÁN VIONE
## VIONE BUSINESS CONNECT ECOSYSTEM — SOLID ARCHITECTURE & CODING CONVENTIONS SOT

---

## 📌 TRANG BÌA & THÔNG TIN DỰ ÁN

*   **Tên dự án:** Hệ thống Kết nối và Số hóa Doanh nghiệp ViOne (ViOne Business Connect Ecosystem)
*   **Tên tài liệu:** Quy ước Viết Code & Thiết kế Kiến trúc SOLID Chuẩn mực (SOLID Architecture, Coding Conventions & APK Packaging)
*   **Mã tài liệu:** `VIONE-SOLID-CONV-02`
*   **Phiên bản:** `2.0.0`
*   **Ngày ban hành:** 08/09/2026
*   **Bộ phận biên soạn:** Phòng Nghiệp vụ & Kiến trúc Hệ thống (Senior Tech Lead / Senior SA Team)
*   **Trạng thái:** Đã phê duyệt & Ban hành chính thức (Approved & Baseline)
*   **Mức độ bảo mật:** Nội bộ (Internal Confidential)

### Lịch sử Thay đổi Phiên bản

| Phiên bản | Ngày | Tác giả | Trạng thái | Nội dung thay đổi |
| :--- | :--- | :--- | :--- | :--- |
| **0.1.0** | 22/08/2026 | SA Team | Nháp | Soạn thảo quy ước viết code và định nghĩa ranh giới các thư mục. |
| **1.0.0** | 28/08/2026 | BA/SA Lead | Phê duyệt | Hoàn thiện tài liệu, bổ sung ví dụ SOLID thực tế trong dự án Vione. |
| **2.0.0** | 08/09/2026 | Senior Tech Lead | Phát hành | Nâng cấp toàn diện tiêu chuẩn SOLID & Clean Architecture: Phân tầng Monorepo NestJS & React TanStack Start, Quy chuẩn TypeScript Strict Type & Zero-any, Ví dụ chi tiết 5 nguyên lý SOLID trên mã nguồn thực tế ViOne, Hướng dẫn tích hợp 8 ngôn ngữ i18n, Quy trình đóng gói Native Android APK chuẩn và Checklist Ready for QA. |

---

## 📑 MỤC LỤC TỔNG THỂ

1. [PHẦN 1: KIẾN TRÚC MONOREPO & RANH GIỚI PHÂN TẦNG (LAYER BOUNDARIES)](#phần-1-kiến-trúc-monorepo--ranh-giới-phân-tầng)
   - 1.1 Cấu trúc NestJS Backend Clean Architecture (`apps/vione_app_be`)
   - 1.2 Cấu trúc React TanStack Start Frontend (`apps/vione_app_fe`)
   - 1.3 Thư viện Dùng chung (`packages/*`)
2. [PHẦN 2: QUY ƯỚC VIẾT CODE CHUẨN MỰC (CODING CONVENTIONS)](#phần-2-quy-ước-viết-code-chuẩn-mực)
   - 2.1 Quy định Đặt tên (Strict Naming Conventions)
   - 2.2 An toàn Kiểu dữ liệu & Kỷ luật Zero-Any (Strict Type Safety)
   - 2.3 Xử lý Ngoại lệ Toàn cục (Global Exception Filters & React Error Boundaries)
   - 2.4 Quản lý Cơ chế Đa ngôn ngữ (8-Language i18n Localization Engine)
3. [PHẦN 3: THIẾT KẾ KIẾN TRÚC SOLID TRONG THỰC TẾ DỰ ÁN VIONE](#phần-3-thiết-kế-kiến-trúc-solid-trong-thực-tế-dự-án-vione)
   - 3.1 S — Single Responsibility Principle (Đơn trách nhiệm)
   - 3.2 O — Open/Closed Principle (Mở rộng thoải mái, Đóng sửa đổi)
   - 3.3 L — Liskov Substitution Principle (Thay thế lớp con an toàn)
   - 3.4 I — Interface Segregation Principle (Phân tách Interface tinh gọn)
   - 3.5 D — Dependency Inversion Principle (Đảo ngược Phụ thuộc & DI)
4. [PHẦN 4: QUY TRÌNH ĐÓNG GÓI & PHÁT HÀNH MOBILE APK (ANDROID & IOS PACKAGING)](#phần-4-quy-trình-đóng-gói--phát-hành-mobile-apk)
   - 4.1 Quy trình Biên dịch & Đồng bộ Native Capacitor
   - 4.2 Cấu hình AndroidManifest (NFC Foreground & Live Camera Permissions)
5. [PHẦN 5: CHECKLIST TRƯỚC KHI SẴN SÀNG CHO QA (READY FOR QA CHECKLIST)](#phần-5-checklist-trước-khi-sẵn-sàng-cho-qa)

---

# PHẦN 1: KIẾN TRÚC MONOREPO & RANH GIỚI PHÂN TẦNG

Để đảm bảo khả năng mở rộng quy mô (Scalability) và bảo trì dễ dàng khi dự án phục vụ hàng trăm Hiệp hội và CLB Doanh nhân, kiến trúc thư mục Monorepo của ViOne phân định nghiêm ngặt các ranh giới:

```
vione_app/
├── apps/
│   ├── vione_app_be/              <-- NestJS Backend Service (API, Auth, DB)
│   │   ├── src/
│   │   │   ├── modules/           <-- Module theo từng Feature Domain
│   │   │   │   ├── auth/          <-- Module Xác thực & Quản lý phiên
│   │   │   │   ├── cards/         <-- Module Danh thiếp số & Chạm NFC
│   │   │   │   ├── meetings/      <-- Module Lịch hẹn 1-on-1
│   │   │   │   ├── members/       <-- Module Thẩm định & Hội viên CLB
│   │   │   │   ├── b2b/           <-- Module Sàn Giao thương B2B
│   │   │   │   └── events/        <-- Module Quản lý Sự kiện & Check-in
│   │   │   ├── common/            <-- Guards, Filters, Interceptors, Decorators
│   │   │   └── prisma/            <-- Prisma Schema, Seeders & Migrations
│   │
│   └── vione_app_fe/              <-- React 18 + TanStack Start + Tailwind
│       ├── src/
│       │   ├── routes/            <-- Routing & Page Controllers
│       │   ├── components/        <-- SFC UI Components & Templates
│       │   ├── hooks/             <-- React Query Hooks & UI State
│       │   ├── lib/               <-- i18n Dictionary & Client Utilities
│       │   └── styles/            <-- Tailwind CSS & Design Tokens
│       └── android/               <-- Native Android Capacitor Project
│
└── packages/
    ├── shared-types/              <-- DTO Interfaces & Enums dùng chung
    └── ui-tokens/                 <-- Bảng màu và Design Token chung
```

## 1.1 Phân tầng NestJS Backend (`apps/vione_app_be`)
1. **Controller Layer (`*.controller.ts`)**:
   - *Nhiệm vụ*: Tiếp nhận HTTP/WebSocket Request, kiểm tra Guard xác thực (`JwtAuthGuard`, `RolesGuard`), validate DTO đầu vào bằng `ValidationPipe`.
   - *Cấm*: Tuyệt đối không viết logic nghiệp vụ (if/else phức tạp, vòng lặp tính toán doanh thu) hoặc gọi trực tiếp Prisma DB tại Controller.
2. **Service Layer (`*.service.ts`)**:
   - *Nhiệm vụ*: Chứa 100% logic nghiệp vụ của Use Case, điều phối các giao dịch cơ sở dữ liệu (`$transaction`), kiểm tra điều kiện tranh chấp thời gian, ném ra các Business Exception với mã lỗi chuẩn hóa.
3. **Repository / Data Access Layer (`*.repository.ts` hoặc Prisma Client)**:
   - *Nhiệm vụ*: Đọc ghi dữ liệu vật lý với PostgreSQL. Định nghĩa các câu truy vấn phức tạp và tối ưu Index.

## 1.2 Phân tầng React Frontend (`apps/vione_app_fe`)
1. **Route Layer (`src/routes/*.tsx`)**:
   - *Nhiệm vụ*: Khai báo đường dẫn URL, bọc kiểm tra quyền nhanh, load dữ liệu ban đầu qua TanStack Loader.
2. **Component Layer (`src/components/**/*.tsx`)**:
   - *Nhiệm vụ*: Hiển thị giao diện thuần (Stateless Functional Components). Nhận dữ liệu từ `props` và phát sự kiện qua `onAction` callback.
   - *Cấm*: Không trực tiếp gọi `fetch()` hoặc `axios.post()` trong component con.
3. **Hook / State Layer (`src/hooks/*.ts`)**:
   - *Nhiệm vụ*: Quản lý React Query cache, mutations, optimistic UI updates và trạng thái Modal/Sheet.

---

# PHẦN 2: QUY ƯỚC VIẾT CODE CHUẨN MỰC (CODING CONVENTIONS)

## 2.1 Quy định Đặt tên (Strict Naming Conventions)

| Đối tượng | Quy ước | Ví dụ Hợp lệ | Ví dụ Bị Cấm (Reject) |
| :--- | :--- | :--- | :--- |
| **Tên File & Thư mục** | `kebab-case` | `scanner-modal.tsx`, `meetings.service.ts` | `ScannerModal.tsx` *(trừ React Component)*, `meetingService.ts` |
| **React Component File**| `PascalCase` | `AssociationLandingTemplate.tsx`, `MemberCard.tsx` | `association_landing.tsx`, `memberCard.tsx` |
| **Class, Interface, Type**| `PascalCase` | `UserEntity`, `MeetingResponseDto`, `MemberStatus` | `user_entity`, `IMeetingResponseDto` *(cấm tiền tố I)* |
| **Hàm & Phương thức** | `camelCase` | `createProposal()`, `resolveCardSlug()`, `useT()` | `CreateProposal()`, `resolve_card_slug()` |
| **Biến & Thuộc tính** | `camelCase` | `currentMemberCode`, `isLuxuryTheme`, `seatNumber` | `Current_Member_Code`, `is_luxury_theme` |
| **Hằng số & Enums** | `UPPER_CASE` | `MAX_MEETING_SLOTS`, `DEFAULT_LOCALE = 'vi'` | `maxMeetingSlots`, `default_locale` |

## 2.2 An toàn Kiểu dữ liệu & Kỷ luật Zero-Any (Strict Type Safety)
*   **Cấm sử dụng kiểu `any`**: Mọi biến, tham số, dữ liệu trả về phải có Type hoặc Interface tường minh. Nếu dữ liệu từ bên thứ ba chưa rõ cấu trúc, bắt buộc sử dụng `unknown` kết hợp với Zod schema parser.
*   **Sử dụng Discriminated Unions cho Trạng thái Phức tạp**:
```typescript
// Chuẩn mực thiết kế Type an toàn
type ScannerState = 
  | { status: 'IDLE' }
  | { status: 'SCANNING'; stream: MediaStream }
  | { status: 'SUCCESS'; payload: string; decodedAt: Date }
  | { status: 'ERROR'; error: CameraPermissionError };
```

## 2.3 Xử lý Ngoại lệ Toàn cục (Error Handling Boundaries)
*   **Backend Global Exception Filter**: Bắt toàn bộ ngoại lệ chưa được xử lý, ghi log chi tiết mã lỗi và chuyển đổi thành định dạng JSON chuẩn của ViOne:
```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const errorCode = exception instanceof BusinessException ? exception.getErrorCode() : 'INTERNAL_SERVER_ERROR';

    response.status(status).json({
      statusCode: status,
      errorCode: errorCode,
      message: exception instanceof Error ? exception.message : 'Unknown server error',
      timestamp: new Date().toISOString(),
    });
  }
}
```
*   **Frontend Error Boundary**: Mọi màn hình chính phải được bọc trong `<ErrorBoundary fallback={<LuxuryErrorFallback />}>` để đảm bảo lỗi cục bộ không làm sập toàn bộ ứng dụng di động.

## 2.4 Quản lý Cơ chế Đa ngôn ngữ (8-Language i18n Engine)
*   **Tuyệt đối không hardcode text hiển thị**: Toàn bộ chuỗi văn bản trên giao diện bắt buộc phải đi qua hook `const t = useT();` và gọi `t('namespace.key')`.
*   **Bộ 8 Ngôn ngữ được Hỗ trợ**:
    - `vi`: Tiếng Việt (Mặc định)
    - `en`: Tiếng Anh (English)
    - `km`: Tiếng Khmer (Campuchia)
    - `my`: Tiếng Miến Điện (Myanmar)
    - `lo`: Tiếng Lào (Lao)
    - `ja`: Tiếng Nhật (Japanese)
    - `ko`: Tiếng Hàn (Korean)
    - `zh`: Tiếng Trung (Chinese)

---

# PHẦN 3: THIẾT KẾ KIẾN TRÚC SOLID TRONG THỰC TẾ DỰ ÁN VIONE

## 3.1 S — Single Responsibility Principle (Đơn Trách nhiệm)
*   *Nguyên lý*: Mỗi Module, Class hoặc Component chỉ có duy nhất một lý do để thay đổi.
*   *Thực tế ViOne*: Component [LandingHero.tsx](file:///d:/download/VICONNECT/VIONE_PROJECT/vione_app/apps/vione_app_fe/src/components/landing/sections/LandingHero.tsx) chỉ chịu trách nhiệm duy nhất là hiển thị phần mở đầu (Hero Section) của trang Landing Page. Nó không tự gọi API gửi email, không tự kiểm tra trạng thái đăng nhập. Mọi hành động click nút "Đăng ký" được truyền ngược lên thông qua callback `onJoinClick()`.

## 3.2 O — Open/Closed Principle (Mở rộng Thoải mái, Đóng Sửa đổi)
*   *Nguyên lý*: Phần mềm nên mở cho việc mở rộng nhưng đóng cho việc sửa đổi mã nguồn gốc.
*   *Thực tế ViOne*: Hệ thống [AssociationLandingTemplate.tsx](file:///d:/download/VICONNECT/VIONE_PROJECT/vione_app/apps/vione_app_fe/src/components/landing/templates/AssociationLandingTemplate.tsx) được thiết kế nhận một tập hợp các `props` cấu hình (Hero, Challenges, Solutions, Partners, Testimonials, CustomSections).
*   Khi triển khai cho khách hàng mới (CLB CEO 1983, Hiệp hội Bất động sản, VCCI), lập trình viên chỉ cần tạo một file dữ liệu cấu hình mới mà không cần sửa đổi bất kỳ dòng code nào trong Template gốc.

## 3.3 L — Liskov Substitution Principle (Thay thế Lớp con An toàn)
*   *Nguyên lý*: Các đối tượng thuộc lớp con có thể thay thế cho lớp cha mà không làm hỏng tính đúng đắn của chương trình.
*   *Thực tế ViOne*: Giao diện quét định danh kế thừa Interface `IIdentityScanner`:
```typescript
export interface IIdentityScanner {
  startScan(): Promise<void>;
  stopScan(): Promise<void>;
  onDataDetected(callback: (payload: string) => void): void;
}

// Cả 2 bộ quét đều thay thế hoàn hảo cho nhau trong UI Sheet
export class LiveCameraQrScanner implements IIdentityScanner { ... }
export class NativeNfcTagScanner implements IIdentityScanner { ... }
```

## 3.4 I — Interface Segregation Principle (Phân tách Interface Tinh gọn)
*   *Nguyên lý*: Không nên ép buộc client phụ thuộc vào các phương thức mà họ không sử dụng.
*   *Thực tế ViOne*: Thay vì một `UserBigObject` khổng lồ chứa cả thông tin cá nhân, cài đặt bảo mật, tài chính và danh bạ, hệ thống tách thành các interface chuyên biệt:
    - `MemberPublicCardView`: Chỉ chứa thông tin công khai hiển thị trên Danh thiếp số (Tên, Ảnh, Công ty, Chức vụ, Bio).
    - `MemberAdminAuditView`: Chứa thông tin nhạy cảm (Mã số thuế, Ngày nộp đơn, Lịch sử phê duyệt).

## 3.5 D — Dependency Inversion Principle (Đảo ngược Phụ thuộc)
*   *Nguyên lý*: Module cấp cao không phụ thuộc vào module cấp thấp. Cả hai phụ thuộc vào sự trừu tượng (Interface).
*   *Thực tế ViOne*: `MeetingsService` không trực tiếp khởi tạo `new PrismaClient()` hoặc phụ thuộc vào thư viện cụ thể. Nó nhận `PrismaService` thông qua cơ chế Dependency Injection của NestJS. Điều này cho phép viết Unit Test dễ dàng bằng cách inject `MockPrismaService`.

---

# PHẦN 4: QUY TRÌNH ĐÓNG GÓI & PHÁT HÀNH MOBILE APK (ANDROID & IOS PACKAGING)

Để đóng gói ứng dụng di động ViOne thành file cài đặt APK cho Android và phân phối cho Hội viên:

## 4.1 Quy trình Biên dịch & Đồng bộ Native Capacitor

```bash
# Bước 1: Di chuyển vào thư mục ứng dụng Frontend
cd apps/vione_app_fe

# Bước 2: Biên dịch gói mã nguồn React thành tệp tĩnh Web Assets
npm run build

# Bước 3: Đồng bộ mã nguồn Web và cấu hình Plugins vào thư mục Android Native
npm run sync:android
# Hoặc: npx cap sync android

# Bước 4: Biên dịch gói APK gỡ lỗi (Debug APK)
cd android
./gradlew.bat assembleDebug

# Đường dẫn file APK hoàn tất:
# apps/vione_app_fe/android/app/build/outputs/apk/debug/app-debug.apk
```

## 4.2 Cấu hình Quyền Native trên Android (`AndroidManifest.xml`)
File `apps/vione_app_fe/android/app/src/main/AndroidManifest.xml` bắt buộc phải chứa các quyền phần cứng:

```xml
<!-- Quyền Camera phục vụ Quét QR Live & Chụp OCR Danh thiếp -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

<!-- Quyền NFC phục vụ Chạm Thẻ Danh thiếp Thông minh 1-Tap -->
<uses-permission android:name="android.permission.NFC" />
<uses-feature android:name="android.hardware.nfc" android:required="false" />

<!-- Quyền Rung Haptic & Kết nối Mạng -->
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

---

# PHẦN 5: CHECKLIST TRƯỚC KHI SẴN SÀNG CHO QA (READY FOR QA CHECKLIST)

Mọi lập trình viên hoặc AI Agent trước khi bàn giao một tính năng kỹ thuật để kiểm thử (QA) bắt buộc phải xác nhận bảng kiểm tra dưới đây:

```markdown
## solid_convention_ack_v2
### 1. Kiến trúc & Phân lớp (Architecture & Boundaries)
- [x] Đã tuân thủ phân lớp Clean Architecture: Controller -> Service -> Repository.
- [x] Toàn bộ logic nghiệp vụ nằm ở tầng Service (Không viết trong file giao diện UI hoặc Controller).
- [x] Các component UI chỉ nhận `props` và gọi callback sự kiện, không gọi trực tiếp Database.

### 2. Kỷ luật Code & An toàn Kiểu (Code Discipline & Type Safety)
- [x] Mọi file mới hoặc sửa đổi đều có khối chú thích `@CODE-MEMORY` ở đầu file.
- [x] Tuyệt đối không sử dụng kiểu `any` trong toàn bộ code mới.
- [x] Không có file logic nào vượt quá 300 dòng code mà không có cấu trúc module hóa.
- [x] Toàn bộ văn bản hiển thị sử dụng mã khóa đa ngôn ngữ qua hàm `t(...)`.

### 3. Hiệu năng & Cơ sở Dữ liệu (Performance & Database)
- [x] Mọi thao tác ghi dữ liệu từ 2 bảng trở lên đều được bọc trong Prisma `$transaction`.
- [x] Các API danh sách sử dụng cơ chế phân trang Cursor-based Pagination.
- [x] Backend trả về dữ liệu chuẩn `display-ready` (Frontend không phải tự join dữ liệu).

### 4. Kiểm thử & Đóng gói (Testing & Build Verification)
- [x] Lệnh `npm run build` chạy thành công không có lỗi TypeScript / Vite.
- [x] Gói APK Android `gradlew assembleDebug` biên dịch thành công 100%.
```

---

## 📌 PHÊ DUYỆT & KÝ TÊN BÀN GIAO

| Đại diện Kỹ thuật & Chất lượng | Họ và Tên | Chữ ký & Ngày |
| :--- | :--- | :--- |
| **Chief Software Architect** | Ban Kiến trúc Phần mềm | *Đã ký xác nhận* — 08/09/2026 |
| **Lead Frontend Engineer** | Ban Phát triển Giao diện | *Đã ký xác nhận* — 08/09/2026 |
| **Lead Backend Engineer** | Ban Phát triển Dịch vụ | *Đã ký xác nhận* — 08/09/2026 |
| **QA Lead / Release Manager** | Ban Quản lý Chất lượng | *Đã phê duyệt quy trình* — 08/09/2026 |
