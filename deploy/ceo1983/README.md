# CLB DOANH NHÂN CEO 1983 - HƯỚNG DẪN VẬN HÀNH & DEPLOY ĐỘC LẬP (HƯỚNG 2)

Thư mục này chứa toàn bộ cấu hình hạ tầng, biến môi trường và tiến trình đóng gói riêng cho **CLB Doanh Nhân CEO 1983**, hoàn toàn tách biệt khỏi ViOne Connect và CRM.

---

## 1. Cấu Trúc Thành Phần
```
deploy/ceo1983/
├── docker-compose.yml       # Cấu hình container độc lập (Port 5002 & 5003)
├── .env.production          # Biến môi trường riêng (VITE_APP_SCOPE=association_app)
├── Dockerfile.frontend      # Dockerfile chạy bản build SSR của CEO 1983
└── README.md                # Tài liệu hướng dẫn vận hành
```

---

## 2. Thông Tin Cổng & Container
* **Container Frontend:** `ceo1983-frontend-prod`
  * **Cổng:** `5002` (`http://14.225.217.232:5002`)
  * **Đặc tính:** Điều hướng trực tiếp vào `/association`, cô lập thương hiệu và notification scope.
* **Container Backend:** `ceo1983-backend-prod`
  * **Cổng:** `5003` (`http://14.225.217.232:5003`)
  * **Đặc tính:** Chạy với `APP_SCOPE=association_app`.

---

## 3. Lệnh Triển Khai Nhanh
Từ thư mục gốc dự án:
```powershell
# Deploy siêu tốc chỉ Frontend (khi đã có .output)
.\fast-deploy-association.ps1 -FrontendOnly -SkipWebBuild

# Deploy toàn bộ cả Frontend + Backend
.\fast-deploy-association.ps1
```
Hoặc qua npm script:
```bash
npm run deploy:association:fe
npm run deploy:association
```

---

## 4. Ứng Dụng Mobile Native (Capacitor)
* **Thư mục source:** `apps/mobile_ceo1983`
* **App ID:** `vn.ceo1983.app`
* **Tên hiển thị:** `CLB CEO 1983`
* **Cấu hình Live Server:** Trỏ thẳng về `http://14.225.217.232:5002`
