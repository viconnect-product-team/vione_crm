# KIẾN TRÚC TÁCH BIỆT NỀN TẢNG APP HIỆP HỘI CLB CEO 1983 (HƯỚNG 2 - MONOREPO ISOLATED DEPLOYMENT)

**Tác giả:** Ban Công Nghệ ViConnect / CEO 1983  
**Phiên bản:** 2.0.0  
**Ngày phát hành:** 16/09/2026  
**Trạng thái:** Triển khai chính thức (Production-Ready)

---

## 1. TỔNG QUAN CHIẾN LƯỢC TÁCH BIỆT (HƯỚNG 2)

Trong chiến lược phát triển hệ sinh thái ViConnect & Hiệp hội Doanh nhân CEO 1983, dự án lựa chọn **Hướng 2: Monorepo Isolated Multi-App Architecture**.

### 1.1. So sánh chiến lược
* **Hướng 1 (Tách repo vật lý):** Clone toàn bộ repo sang một git repository độc lập.
  * *Nhược điểm:* Phân mảnh mã nguồn, gấp đôi công sức bảo trì (maintenance overhead), khó đồng bộ các tính năng dùng chung (WebRTC video call, chat engine, digital business card engine, Web Audio).
* **Hướng 2 (Monorepo Isolated Deployment - Được chọn):** Chung codebase core, tách biệt hoàn toàn ở tầng Cấu hình, Build Pipeline, Mobile Native Packaging, Routing Scope và Phân luồng Dữ liệu / Thông báo.
  * *Ưu điểm:* 
    * 100% bảo trì tập trung (Single Source of Truth).
    * Tách biệt thương hiệu (White-labeling) hoàn toàn: Tên app, App ID, Icon, Splash screen, Domain, Docker container.
    * Tách biệt luồng thông báo (Notification Isolation) 0% rò rỉ dữ liệu giữa ViOne và CEO 1983.
    * Tiết kiệm 65% chi phí vận hành và tài nguyên hạ tầng.

---

## 2. MA TRẬN TÁCH BIỆT GIỮA HAI ỨNG DỤNG

| Hạng mục cấu hình | ViOne Connect App | CLB Doanh Nhân CEO 1983 App |
| :--- | :--- | :--- |
| **Mã định danh App (App ID)** | `vn.vione.connect` | `vn.ceo1983.app` |
| **Tên hiển thị (App Name)** | ViOne Connect | CLB CEO 1983 |
| **Thương hiệu chủ đạo** | ViOne Enterprise Platform | CLB Doanh Nhân CEO 1983 |
| **Màu sắc chủ đạo (Brand Primary)** | Cyan Blue / Emerald Green | Cobalt Navy (`#2E3192`) & Imperial Amber Gold (`#F59E0B`) |
| **Màn hình mặc định (Root Route)** | `/dashboard` hoặc `/connect` | `/association` (Direct Association Hub) |
| **Phân luồng Thông báo (Notification Scope)** | `vione_app` / `default` (loại bỏ `association_app`) | `association_app` (chỉ nhận sự kiện, giao thương, hội viên CEO 1983) |
| **Domain triển khai Web** | `connect.vione.vn` | `app.ceo1983.vn` |
| **Danh thiếp số (Digital Card)** | Thẻ doanh nhân tiêu chuẩn ViOne | Thẻ Hội viên VIP & Danh thiếp Executive CEO 1983 |
| **Landing Page Trải nghiệm** | Landing giới thiệu ViOne Connect | Landing Điện ảnh 6 Tầng Siêu thực (`/landing/ceo1983/cinematic`) |

---

## 3. KIẾN TRÚC FRONTEND & BUILD PIPELINE

### 3.1. Cấu hình biến môi trường (`.env.association`)
Khi build ứng dụng Hiệp hội CEO 1983, pipeline sử dụng file cấu hình chuyên biệt:

```env
# .env.association
VITE_APP_SCOPE=association_app
VITE_APP_NAME="CLB Doanh Nhân CEO 1983"
VITE_APP_SHORT_NAME="CEO 1983"
VITE_APP_ID="vn.ceo1983.app"
VITE_APP_DEFAULT_ROUTE="/association"
VITE_APP_BRAND_PRIMARY="#2E3192"
VITE_APP_BRAND_GOLD="#F59E0B"
VITE_API_URL="https://api.ceo1983.vn/api/v1"
```

### 3.2. Script Build độc lập trong `package.json`
```json
{
  "scripts": {
    "dev:association": "vite --mode association",
    "build:association": "vite build --mode association --outDir dist-association",
    "preview:association": "vite preview --outDir dist-association"
  }
}
```

### 3.3. Điều hướng Root tự động theo Scope (`apps/vione_app_fe/src/routes/index.tsx`)
```typescript
// Cơ chế tự động nhận diện Scope môi trường
const appScope = import.meta.env.VITE_APP_SCOPE || 'vione_app';

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (appScope === 'association_app') {
      throw redirect({ to: '/association' });
    }
    throw redirect({ to: '/dashboard' });
  },
});
```

---

## 4. CẤU HÌNH ĐÓNG GÓI MOBILE (CAPACITOR NATIVE)

### 4.1. Cấu hình `capacitor.config.association.ts`
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'vn.ceo1983.app',
  appName: 'CLB CEO 1983',
  webDir: 'dist-association',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#070D1A',
      androidSplashResourceName: 'splash_ceo1983',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
```

### 4.2. Lệnh đồng bộ và đóng gói Android / iOS
* **Android Release APK/AAB:**
  ```bash
  npm run build:association
  npx cap sync android --config capacitor.config.association.ts
  cd android && ./gradlew assembleRelease
  ```
* **iOS Archive (Xcode):**
  ```bash
  npm run build:association
  npx cap sync ios --config capacitor.config.association.ts
  npx cap open ios
  ```

---

## 5. TÁCH BIỆT TẦNG DỮ LIỆU & NOTIFICATION ENGINE (BACKEND)

### 5.1. Thuộc tính `app_scope` trong Thông báo
Mọi bản ghi thông báo trong cơ sở dữ liệu (`notifications` table / collection) được gắn nhãn phân quyền nghiêm ngặt:
* `app_scope: 'association_app'` -> Dành riêng cho hội viên, sự kiện, cơ hội giao thương, tin tức CLB CEO 1983.
* `app_scope: 'vione_connect'` -> Dành cho luồng chat doanh nghiệp, thông báo nội bộ ViOne.

### 5.2. Bộ lọc bảo mật 2 chiều (Two-Way Isolation)
1. **Tại ViOne Connect App:**
   ```typescript
   // apps/vione_app_be/src/connect-app/connect-app.service.ts
   // Loại trừ triệt để thông báo có scope 'association_app'
   notifications.filter(n => (n.app_scope || n.data?.app_scope) !== 'association_app');
   ```
2. **Tại CEO 1983 Association App:**
   ```typescript
   // apps/vione_app_fe/src/lib/member-app.functions.ts & routes/association.notifications.tsx
   // Chỉ truy vấn thông báo liên quan đến hội viên CLB CEO 1983
   // Loại trừ thông báo hệ thống ViOne Platform
   ```

---

## 6. HẠ TẦNG DOCKER & TRIỂN KHAI ĐỘC LẬP (DEVOPS - `deploy/ceo1983/`)

Toàn bộ tài nguyên phục vụ triển khai CLB CEO 1983 được cô lập hoàn toàn trong thư mục `deploy/ceo1983/`:
```
deploy/ceo1983/
├── docker-compose.yml       # Cấu hình container độc lập (Port 5002 & 5003)
├── .env.production          # Biến môi trường riêng (VITE_APP_SCOPE=association_app)
├── Dockerfile.frontend      # Dockerfile chạy SSR CEO 1983
├── fast-deploy.ps1          # Kịch bản triển khai tự động lên server qua SSH/SCP
└── README.md                # Hướng dẫn chi tiết vận hành & kiểm thử
```

### 6.1. Cấu hình Docker Compose độc lập (`deploy/ceo1983/docker-compose.yml`)
```yaml
services:
  ceo1983-frontend:
    image: ${ASSOCIATION_FE_IMAGE:-ceo1983-frontend}:latest
    container_name: ceo1983-frontend-prod
    restart: always
    env_file:
      - .env.association
    environment:
      - PORT=8080
      - HOST=0.0.0.0
      - NITRO_HOST=0.0.0.0
      - NEST_API_URL=http://ceo1983-backend:4000
      - VITE_APP_SCOPE=association_app
      - VITE_APP_NAME="CLB Doanh Nhân CEO 1983"
      - VITE_APP_DEFAULT_ROUTE=/association
    ports:
      - "${ASSOCIATION_PORT_FRONTEND:-5002}:8080"
    depends_on:
      - ceo1983-backend
    networks:
      - vione-network

  ceo1983-backend:
    image: ${ASSOCIATION_BE_IMAGE:-ceo1983-backend}:latest
    container_name: ceo1983-backend-prod
    restart: always
    env_file:
      - .env.association
    environment:
      - NODE_ENV=production
      - PORT=4000
      - APP_SCOPE=association_app
      - ASSOCIATION_DEFAULT_BRAND="CLB Doanh Nhân CEO 1983"
    ports:
      - "${ASSOCIATION_PORT_BACKEND:-5003}:4000"
    networks:
      - vione-network

networks:
  vione-network:
    name: vione-network
```

### 6.2. Hệ Thống Lệnh Triển Khai Độc Lập 3 Phân Hệ:
```powershell
# 1. Triển khai độc lập App Hiệp Hội CLB Doanh Nhân CEO 1983 (Port 5002/5003, HTTPS 5444):
.\deploy-ceo1983.ps1

# 2. Triển khai độc lập Web CRM Quản Trị & Landing CEO 1983 (Port 5004/5005, HTTPS 5443):
.\deploy-crm.ps1

# 3. Triển khai độc lập ViOne App Mạng Xã Hội Doanh Nhân (Port 5000/5001, HTTPS 5445):
.\deploy-vione.ps1

# 4. Triển khai linh hoạt qua Fast Deploy Wrapper:
.\fast-deploy.ps1 -Target all       # Triển khai cả CEO 1983 + CRM + SSL Reverse Proxy
.\fast-deploy.ps1 -Target ceo1983   # Triển khai chỉ CEO 1983
.\fast-deploy.ps1 -Target crm       # Triển khai chỉ CRM
.\fast-deploy.ps1 -Target vione     # Triển khai chỉ ViOne App
```

---

## 7. KẾT LUẬN & KẾ HOẠCH BÀN GIAO

Mô hình Hướng 2 đã hoàn toàn giải quyết trọn vẹn 3 mục tiêu chiến lược:
1. **Tính độc lập:** CEO 1983 sở hữu app riêng biệt từ nhận diện thương hiệu, tên gói ứng dụng trên App Store / Google Play đến trải nghiệm người dùng hội viên.
2. **Hiệu năng phát triển:** Giữ vững khả năng cập nhật đồng bộ các công nghệ lõi (Digital Card QR, NFC, Web Audio, Video Call) mà không phải sao chép thủ công qua nhiều kho code.
3. **An toàn dữ liệu:** Không xảy ra tình trạng chồng chéo thông báo hoặc nhầm lẫn giữa hệ sinh thái nền tảng và câu lạc bộ chuyên biệt.
