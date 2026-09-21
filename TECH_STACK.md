# Vione Business Connect — Tech Stack & Dev Environment Documentation

Tài liệu này đóng vai trò là ngữ cảnh chuẩn (context) cho các AI coding agent và nhà phát triển tham gia dự án. Vui lòng cập nhật tài liệu khi cấu trúc thư mục hoặc thư viện cốt lõi thay đổi.

---

## 1. Cấu trúc Monorepo & Workspace

Dự án được cấu trúc dạng Monorepo sử dụng **NPM Workspaces** và điều phối bằng **Turborepo** (`turbo.json`).

```text
vione_app/
├── apps/
│   ├── vione_app_fe/       # Web Client / PWA (TanStack React Start)
│   ├── vione_app_be/       # Backend API (NestJS + Prisma Client)
│   └── mobile/             # Mobile Wrapper (Capacitor Native Project)
├── packages/
│   └── db/                 # Shared Database Package (Prisma Schema & Client)
├── supabase/
│   ├── config.toml         # Cấu hình Supabase local/staging
│   └── migrations/         # 170+ tệp SQL Migrations cơ sở dữ liệu
├── package.json            # Cấu hình workspace gốc & scripts
└── turbo.json              # Định nghĩa các task dependencies cho Turborepo
```

### Chi tiết các Workspace chính:

*   **`@vibe/vione_app_fe` (Web / PWA):**
    *   **Vị trí:** [apps/vione_app_fe](file:///d:/download/VICONNECT/VIONE_PROJECT/vione_app/apps/vione_app_fe)
    *   **Nhiệm vụ:** Ứng dụng client phía trước, hỗ trợ SSR (Server-Side Rendering) thông qua TanStack Start và có thể đóng gói thành PWA hoặc Native Mobile qua Capacitor.
*   **`@vibe/vione_app_be` (Backend API):**
    *   **Vị trí:** [apps/vione_app_be](file:///d:/download/VICONNECT/VIONE_PROJECT/vione_app/apps/vione_app_be)
    *   **Nhiệm vụ:** API Server cung cấp các nghiệp vụ doanh nghiệp, xác thực JWT, và xử lý logic kết nối.
*   **`@vibe/vione_app_mobile` (Mobile wrapper):**
    *   **Vị trí:** [apps/mobile](file:///d:/download/VICONNECT/VIONE_PROJECT/vione_app/apps/mobile)
    *   **Nhiệm vụ:** Dự án cấu hình native Capacitor chứa mã nguồn Android (`android/`) và iOS (`ios/`). Nó đóng gói giao diện web hoặc kết nối tới địa chỉ remote dev.
*   **`@vibe/db` (Shared Package):**
    *   **Vị trí:** [packages/db](file:///d:/download/VICONNECT/VIONE_PROJECT/vione_app/packages/db)
    *   **Nhiệm vụ:** Quản lý cơ sở dữ liệu dùng chung thông qua Prisma ORM, xuất mã `PrismaClient` cho Backend sử dụng.

---

## 2. Chi tiết Công nghệ & Thư viện Lõi

### A. Frontend (Web / PWA)
*   **Framework:** **React 19** kết hợp **TanStack React Start** (framework hỗ trợ SSR và Server Functions thông qua Nitro).
*   **Routing & State:** `@tanstack/react-router` (Type-safe routing) và `@tanstack/react-query` (Server state management).
*   **Styling:** **Tailwind CSS v4** (sử dụng `@tailwindcss/vite` tích hợp trực tiếp vào Vite), kết hợp thư viện thành phần **Radix UI** (Accordion, Dialog, Popover, Dropdown, v.v.).
*   **Màu sắc / Nhận diện:** Tông màu nâu ấm / vàng Champagne Gold sang trọng (`.vione-tone` và `.bc-app` CSS tokens), tích hợp hiệu ứng kính mờ (glassmorphism) và các chuyển cảnh mượt mà.
*   **AI Integration:** `@ai-sdk/openai-compatible` & `ai` (Vercel AI SDK).
*   **Sinh mã & Xuất bản:** `@lovable.dev/vite-tanstack-config` (quản lý cấu hình Vite tối ưu), `jspdf` & `html2canvas-pro` (xuất PDF danh thiếp).
*   **Capacitor Client APIs:** `@capacitor/core`, `@capacitor/android`, `@capacitor/ios`.

### B. Backend (API)
*   **Framework:** **NestJS 11** (`@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`).
*   **Xác thực:** Passport.js (`@nestjs/passport`, `passport-jwt`, `passport-local`, `bcrypt` mã hóa mật khẩu, `@nestjs/jwt`).
*   **Kết nối DB:** Sử dụng package nội bộ `@vibe/db`.

### C. Database Layer & Shared Package
*   **ORM:** **Prisma ORM** (`@prisma/client` và CLI `prisma`).
*   **Provider:** PostgreSQL (`postgresql`).
*   **Độ tương thích PgBouncer:** Bắt buộc sử dụng tham số `?pgbouncer=true` (hoặc `&pgbouncer=true`) trong chuỗi kết nối `DATABASE_URL` khi sử dụng connection pooler cổng `6432` của Supabase để tránh lỗi Prisma `P1013`.

---

## 3. Database System (Local & Server DB)

### Local Database (Docker Compose)
Dự án cung cấp cấu hình chạy PostgreSQL cục bộ thông qua Docker Compose:
*   **File cấu hình:** [docker-compose.local.yml](file:///d:/download/VICONNECT/VIONE_PROJECT/vione_app/docker-compose.local.yml)
*   **Image:** `postgres:15`
*   **Cổng kết nối:** `5433:5432` (tránh xung đột với cổng Postgres mặc định 5432 trên máy host).
*   **Thông tin đăng nhập mặc định:**
    *   Host: `localhost`
    *   Port: `5433`
    *   User: `root`
    *   Password: `rootpassword`
    *   Database: `vibe_db`
    *   URL kết nối: `postgresql://root:rootpassword@localhost:5433/vibe_db`

### Remote / Staging / Production Database
*   **Nền tảng:** Sử dụng **Supabase PostgreSQL**.
*   **Quản lý Migrations:** Sử dụng **Supabase CLI**.
    *   Các tệp migrations dạng SQL nằm ở thư mục [supabase/migrations](file:///d:/download/VICONNECT/VIONE_PROJECT/vione_app/supabase/migrations).
    *   Các migrations được áp dụng theo thứ tự timestamp của tên tệp.
*   **Quy tắc thiết kế bảng (Invariants):**
    *   Sử dụng định dạng **String (UUID)** cho các khóa chính thay vì BigInt để đồng bộ tốt hơn.
    *   Tất cả các bảng public đều được bảo vệ bởi Row Level Security (RLS). Không cho phép chính sách mặc định mở rộng `USING (true)` cho role anonymous.

---

## 4. Hướng dẫn thiết lập môi trường phát triển (Dev Environment Setup)

### Yêu cầu tiên quyết (Prerequisites)
*   **Node.js:** Phiên bản **Node 22 LTS (hoặc mới hơn)**. Lưu ý: Node 22 tích hợp sẵn WebSocket giúp ngăn chặn lỗi container crash loop khi deploy Docker trên server dev.
*   **NPM:** NPM CLI được thiết lập tự động qua `"packageManager": "npm@10.8.2"`.
*   **Docker Desktop:** Dành cho việc chạy cơ sở dữ liệu cục bộ.
*   **Mobile SDK:**
    *   **Android:** Android Studio & Java SDK 17.
    *   **iOS:** Xcode (yêu cầu máy macOS).

---

### Bước 1: Thiết lập Web & Backend API

1.  **Cài đặt các gói phụ thuộc:**
    Chạy lệnh sau tại thư mục gốc để cài đặt dependencies cho toàn bộ monorepo:
    ```bash
    npm install
    ```

2.  **Cấu hình biến môi trường (`.env`):**
    *   **Backend & DB gốc:** Tạo file `.env` ở thư mục gốc của dự án:
        ```env
        DATABASE_URL="postgresql://root:rootpassword@localhost:5433/vibe_db"
        JWT_SECRET="sinh_mot_jwt_key_ngau_nhien_o_day"
        # Bổ sung các cấu hình SMTP, Storage nếu cần
        ```
    *   **Frontend:** Copy file mẫu `.env.example` thành `.env` trong [apps/vione_app_fe](file:///d:/download/VICONNECT/VIONE_PROJECT/vione_app/apps/vione_app_fe):
        ```env
        VITE_SUPABASE_URL="https://your-supabase-ref.supabase.co"
        VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
        ```

3.  **Khởi động Cơ sở dữ liệu local (nếu không dùng DB Supabase cloud):**
    ```bash
    docker compose -f docker-compose.local.yml up -d
    ```

4.  **Sinh mã Prisma Client:**
    ```bash
    # Chạy trực tiếp qua npm workspace
    npm run generate --workspace=@vibe/db
    ```

5.  **Áp dụng Migrations lên Database:**
    *   Nếu dùng Supabase DB:
        ```bash
        npx supabase db push
        ```
    *   Nếu dùng Local DB chạy Docker:
        ```bash
        cd packages/db
        npx prisma db push
        ```

6.  **Khởi động máy chủ dev (Cả Frontend + Backend):**
    Tại thư mục gốc, khởi động môi trường dev đồng thời qua Turborepo:
    ```bash
    npm run dev
    ```
    *   **Frontend Web:** Mặc định chạy ở `http://localhost:5173`.
    *   **Backend NestJS:** Chạy ở chế độ watch mode.

---

### Bước 2: Thiết lập Mobile App (Capacitor)

Dự án hiện đang sử dụng **Capacitor** để đóng gói và biên dịch native app thay vì React Native Expo. Mặc dù vậy, tài liệu này vẫn hướng dẫn chi tiết cả hai cách tiếp cận để hỗ trợ nhà phát triển.

#### Cách 1: Thiết lập với Capacitor (Mặc định trong Repo)

Capacitor sử dụng cấu hình nằm tại [apps/mobile/capacitor.config.ts](file:///d:/download/VICONNECT/VIONE_PROJECT/vione_app/apps/mobile/capacitor.config.ts) để điều phối.

1.  **Xây dựng phiên bản Web tĩnh:**
    Trước khi đồng bộ dữ liệu vào Capacitor, bạn cần build frontend:
    ```bash
    # Chạy build frontend
    npx turbo run build --filter=@vibe/vione_app_fe
    ```

2.  **Đồng bộ dữ liệu sang thư mục Mobile:**
    Sao chép tệp build tĩnh từ `.output/public` sang thư mục `www` của Mobile App:
    ```bash
    # Tại thư mục gốc hoặc apps/vione_app_fe
    npm run cap:sync --workspace=@vibe/vione_app_fe
    ```

3.  **Mở dự án trong IDE Native:**
    Di chuyển vào thư mục [apps/mobile](file:///d:/download/VICONNECT/VIONE_PROJECT/vione_app/apps/mobile):
    *   **Android (mở Android Studio):**
        ```bash
        npx cap open android
        ```
    *   **iOS (mở Xcode - chỉ macOS):**
        ```bash
        npx cap open ios
        ```

4.  **Thiết lập Live Reload (Kiểm thử tức thì trên Simulator):**
    Để kiểm thử giao diện lập tức không cần build lại liên tục, cấu hình địa chỉ IP máy của bạn trong `capacitor.config.ts` (ở cả `apps/vione_app_fe` và `apps/mobile` nếu cần):
    ```typescript
    // apps/mobile/capacitor.config.ts
    const config: CapacitorConfig = {
      appId: 'com.vione.app',
      appName: 'Vione Business Connect',
      webDir: 'www',
      server: {
        url: 'http://<IP_MÁY_TÍNH_CỦA_BẠN>:5173', // ví dụ: 192.168.1.15
        cleartext: true
      }
    };
    ```
    Chạy `npx cap copy` sau khi sửa cấu hình, mở Simulator trên Android Studio/Xcode và khởi động.

---

#### Cách 2: Hướng dẫn tích hợp React Native Expo / EAS (Dành cho việc nâng cấp hoặc phát triển chéo)

*Lưu ý: Nếu trong tương lai nhóm quyết định chuyển đổi hoặc tích hợp Expo, các bước sau sẽ được thực hiện để thiết lập Expo Go và EAS Build.*

1.  **Cài đặt Expo CLI toàn cục hoặc cục bộ:**
    ```bash
    npm install -g expo-cli
    ```

2.  **Khởi chạy dự án Expo (Nếu có thư mục Expo):**
    ```bash
    # Chạy server phát triển Expo
    npx expo start
    ```
    *   **Expo Go:** Quét mã QR hiển thị trên màn hình terminal bằng ứng dụng **Expo Go** (tải trên App Store / Google Play) trên điện thoại thật cùng mạng Wi-Fi để xem ứng dụng chạy thử.
    *   **Chạy Simulator:** Nhấn phím `a` trên terminal để mở Android Emulator, hoặc `i` để mở iOS Simulator.

3.  **Cấu hình EAS (Expo Application Services) để build Cloud:**
    *   Cài đặt EAS CLI:
        ```bash
        npm install -g eas-cli
        ```
    *   Đăng nhập tài khoản Expo:
        ```bash
        eas login
        ```
    *   Khởi tạo dự án EAS Build (tự động tạo tệp `eas.json`):
        ```bash
        eas build:configure
        ```
    *   **Tạo bản build thử nghiệm:**
        *   Tạo bản build Android (.apk) để cài đặt thử:
            ```bash
            eas build --platform android --profile preview
            ```
        *   Tạo bản build iOS (Simulator):
            ```bash
            eas build --platform ios --profile simulator
            ```

---

## 5. Lưu ý quan trọng cho AI Coding Agent

1.  **UTF-8 Encoding:** Luôn cấu hình IDE lưu tệp `.env` dưới dạng mã hóa **UTF-8 không BOM** (UTF-8 without BOM). Ký tự BOM vô hình sinh ra từ Windows sẽ làm hỏng kết nối cơ sở dữ liệu khi deploy Docker lên máy chủ Linux.
2.  **Line Endings (LF):** Mọi tệp script bash (`.sh`) và các cấu hình docker compose phải được lưu với định dạng xuống dòng **LF** để tránh lỗi biên dịch cú pháp shell trên môi trường Linux.
3.  **Relative URLs:** Khi thực hiện các lệnh gọi API từ client (ví dụ: upload avatar), luôn dùng đường dẫn tương đối `/api/...` thay vì đường dẫn tuyệt đối kèm `window.location.origin` nhằm tránh lỗi CORS và xung đột cổng kết nối cục bộ.
4.  **Prisma Type Mismatch:** Khi viết query, hãy chú ý cấu trúc schema ở [schema.prisma](file:///d:/download/VICONNECT/VIONE_PROJECT/vione_app/packages/db/prisma/schema.prisma) để tránh các thuộc tính legacy chưa được đồng bộ (như `password_salt` hoặc `email` ở bảng users).
5.  **Memory Limit during Build:** Khi thực hiện build frontend, Node cần tăng giới hạn bộ nhớ lớn để tránh lỗi OOM. Lệnh build chuẩn đã được tích hợp giới hạn bộ nhớ: `cross-env NODE_OPTIONS=--max-old-space-size=12288 vite build`.

---

## 6. Multi-Tenant SaaS Architecture & Realtime WebSocket Protocol

### 6.1. Kiến Trúc SaaS Đa Tổ Chức (Multi-Tenant Architecture)
*   **Mô hình SaaS**: Hệ thống được thiết kế hướng dịch vụ đám mây phục vụ hàng loạt tổ chức, hiệp hội (Hiệp hội Doanh nhân, Hội Doanh nghiệp trẻ, Câu lạc bộ CEO, Liên minh ngành nghề) trên cùng một cơ sở hạ tầng.
*   **Tenant Isolation**:
    *   Mỗi tổ chức có một định danh `association_id` (Tenant Identifier).
    *   Tách biệt dữ liệu cấp tổ chức (Hội viên, Báo cáo, Tài chính, Sự kiện, Thông báo nội bộ) qua Scope Middleware và PostgreSQL RLS.
*   **Unified Executive Identity**:
    *   Một tài khoản người dùng (`User`) duy nhất có thể liên kết với nhiều tổ chức/hiệp hội, đóng vai trò hội viên hoặc quản trị viên ở từng tổ chức.
    *   Sở hữu một Danh thiếp số (Digital Business Card) toàn cầu, hỗ trợ chia sẻ qua NFC, QR Code và liên kết động.

### 6.2. Ma Trận Nghiệp Vụ: Mobile Connect App vs Web CRM

| Đặc Điểm | Mobile Connect App (`/connect-app/*`) | Web CRM & Operations (`/`, `/dashboard`, `/business-connect/*`) |
| :--- | :--- | :--- |
| **Đối tượng sử dụng** | Cá nhân Doanh nhân, Hội viên, Khách mời tại sự kiện | Ban Lãnh đạo, Ban Thư ký, Quản trị viên Hiệp hội & Sales/CRM Doanh nghiệp |
| **Thiết bị tối ưu** | Smartphone (iOS/Android PWA & Native Capacitor) | Máy tính để bàn, Laptop, Màn hình lớn (Desktop Web) |
| **Chức năng lõi** | - Quét/Chạm danh thiếp NFC, QR Code<br>- Xử lý lời mời kết nối tức thì<br>- Nhắn tin 1-1 & nhóm thời gian thực<br>- Bảng tin Khoảnh khắc (Moments feed)<br>- Đặt lịch hẹn & Cuộc gặp 1-1 thông minh<br>- Trí tuệ quan hệ cá nhân (Relationship Intelligence) | - Quản trị hồ sơ & phân hạng hội viên<br>- Soạn & gửi thông báo toàn hiệp hội<br>- Báo cáo tài chính & hội phí<br>- Quản lý nhà tài trợ & quyền lợi đối tác<br>- Pipeline CRM kết nối kinh doanh B2B<br>- Phân tích hiệu quả giao thương tổng thể |
| **Giao diện & Trải nghiệm** | Executive Minimal Luxury (Đen/Hoàng kim, vuốt chạm mượt mà) | Bảng điều khiển quản trị hiện đại, bộ lọc đa chiều, Topbar Notification popover |

### 6.3. Chuẩn Giao Thức WebSocket Realtime (`ConnectAppGateway`)
*   **Namespace**: `/connect-app`
*   **Xác thực kết nối**: Bearer JWT Token hoặc Cookie phiên làm việc.
*   **Hệ thống Phòng đa tầng (Multi-tier Rooms)**:
    *   `user:<userId>`: Phòng cá nhân cho các sự kiện riêng tư (lời mời kết nối, tin nhắn 1-1, gắn thẻ).
    *   `assoc:<associationId>`: Phòng hiệp hội/tổ chức cho ban quản trị CRM (hội viên mới đăng ký, nộp phí, đăng ký tài trợ).
    *   `emitToAll`: Phát sóng toàn bộ các phiên làm việc Web CRM Desktop.
*   **Danh sách Sự kiện Realtime**:
    *   `notification:new`: Thông báo mới được gửi đến (kèm `targetRoute` để điều hướng click).
    *   `notification:updated`: Trạng thái thông báo thay đổi (đã đọc/chưa đọc, đã chấp nhận/từ chối lời mời).
    *   `notification:deleted`: Thông báo bị xóa (xóa đơn lẻ hoặc xóa hàng loạt).
    *   `connection:requested`: Có người dùng gửi lời mời kết nối mới.
    *   `connection:accepted`: Lời mời kết nối được chấp nhận -> Cập nhật trạng thái tức thì sang "✓ Đã kết nối".
    *   `connection:declined`: Lời mời kết nối bị từ chối -> Cập nhật sang "✕ Đã từ chối".
    *   `message:new`: Tin nhắn văn bản/đa phương tiện mới trong hộp thoại.
    *   `nfc:tapped`: Sự kiện chạm danh thiếp NFC thành công.

### 6.4. Bảng Tin Khoảnh Khắc (Moments Stream) & Bình Luận Đính Kèm Ảnh
*   **Đăng Khoảnh Khắc (Facebook-Grade Workflow)**:
    *   Hỗ trợ bài viết đa năng: Text note, đính kèm tối đa 6 ảnh với preview và upload trực tiếp lên Nest storage (`/connect-app/relationship-moments`), chọn gắn thẻ đối tác từ danh bạ mạng lưới, huy hiệu cảm xúc kinh doanh (Ký hợp đồng, Gặp gỡ đối tác, Dự án mới, Cơ hội kinh doanh), check-in vị trí, và cấu hình quyền riêng tư.
    *   Backend endpoints: `POST /connect-app/moment/` (prepare), `POST /connect-app/moment/:id/finalize` (finalize), `POST /connect-app/moments/notify-tags` (notify tagged users).
*   **Bình Luận Đính Kèm Ảnh**:
    *   Cho phép đính kèm ảnh khi bình luận (`photoUrl`), hiển thị ảnh xem trước, tải lên server an toàn, và hỗ trợ phóng to ảnh (Lightbox) khi người dùng bấm vào ảnh trong bình luận.

### 6.5. Điều Hướng Hành Động Tức Thì Từ Thông Báo (Actionable Notification Redirection)
*   Mọi thông báo từ Web CRM tới Mobile đều mang trường `targetRoute` (ví dụ: `/members?status=pending`, `/fees`, `/events`, `/connect-app/network`).
*   Khi người dùng hoặc admin bấm vào thông báo, hệ thống tự động:
    1. Đánh dấu đã đọc (`status = 'read'`).
    2. Điều hướng thẳng tới trang nghiệp vụ cần xử lý (ví dụ: màn hình Quản lý hội viên ở bộ lọc Chờ duyệt khi có người nộp hồ sơ xin vào CLB CEO 1983).

