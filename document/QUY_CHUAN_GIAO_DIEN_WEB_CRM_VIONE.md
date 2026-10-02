# QUY CHUẨN THIẾT KẾ GIAO DIỆN (UI/UX) - WEB CRM VIONE
## HỆ THỐNG QUẢN TRỊ KINH DOANH, ĐỐI TÁC, QUY TRÌNH & THEO DÕI TIẾN ĐỘ DOANH NGHIỆP (BRD MASTER 5.0)

> **Phiên bản:** v5.0 - Chuẩn Hóa Theo BRD Master 5.0 & Bộ Quy Trình Vận Hành Doanh Nghiệp Toàn Diện  
> **Áp dụng cho:** Phân hệ Web CRM ViOne (`apps/vione_app_fe`)  
> **Triết lý chủ đạo:** Chuẩn mực B2B, Công nghệ Hiện đại, Tinh gọn, Minh bạch, Năng suất, Kiểm soát toàn diện quy trình làm việc và khối lượng tải của nhân sự.  
> **NGUYÊN TẮC CỐT LÕI:** "CÀNG ÍT MÀU - ÍT CHỮ CÀNG TỐT - CHUẨN HÓA DỮ LIỆU ĐỒNG NHẤT - QUAN TÂM NHÌN THẤU TIẾN ĐỘ NHÂN VIÊN"

---

## 1. NGUYÊN TẮC BẮT BUỘC TOÀN HỆ THỐNG (STRICT STANDARDS)

1. **THỐNG NHẤT BẢNG MÀU CHUẨN DOANH NGHIỆP C-LEVEL:**
   - Màu chủ đạo: Dark Obsidian Slate (`#0F172A`, `#0B0F17`), Trắng (`#FFFFFF`), Viền xám mảnh (`#E2E8F0`).
   - Màu nhấn nhận diện thương hiệu ViOne: Vàng Nâu ViOne (`#D8B282`, `#A67A47`, `#C29B69`).
   - Trạng thái nghiệp vụ:
     - Xanh lá (`#16A34A`): Hoàn thành / Đúng giờ / Hợp lệ.
     - Đỏ viền phát sáng (`#DC2626`, `shadow-[0_0_12px_rgba(220,38,38,0.5)]`): Quá hạn deadline (BR-WRK-02) / Bán kính ngoài 50m (BR-HRM-01).
     - Hổ phách (`#D97706`): Quá tải &gt; 45h/tuần (BR-WRK-14) / Tờ trình chờ phê duyệt (BR-FIN-02).

2. **KÍCH THƯỚC NÚT VÀ CỤM ĐIỀU KHIỂN CỐ ĐỊNH:**
   - Tất cả các nút bấm, ô tìm kiếm và ô chọn bộ lọc (Select/Dropdown) trên cùng thanh điều hướng phải có chiều cao bằng nhau (`h-9` hoặc `h-10`).
   - Căn chỉnh thẳng hàng, không để nút to nút nhỏ gây mất cân đối thị giác.

---

## 2. BỐ CỤC QUẢN TRỊ QUY TRÌNH & VẬN HÀNH DOANH NGHIỆP (BRD MASTER 5.0)

### 2.1. Quản Trị Quy Trình & Kanban BPMN 2.0 (`/workflow`)
- **BR-WRK-01:** Bắt buộc có người phụ trách (Assignee) và thời hạn hoàn thành (Deadline) khi tạo công việc.
- **BR-WRK-02:** Cảnh báo đỏ phát sáng (Glowing Red Pulse) lập tức khi công việc bị quá hạn.
- **BR-WRK-06:** Giới hạn công việc đang xử lý (WIP Limit $\le 5$) trên cột In Progress.
- **BR-WRK-07:** Bắt buộc tích đủ 100% danh sách đầu việc (Checklist) trước khi chuyển trạng thái sang Hoàn thành (Done).
- **BR-WRK-10:** Chuyển đổi linh hoạt giữa giao diện Kanban 4 cột và biểu đồ Gantt tiến độ dạng Finish-to-Start.

### 2.2. Giám Sát Tải Làm Việc Của Nhân Sự (`/workload`)
- **BR-WRK-14:** Bản đồ nhiệt khối lượng công việc (Workload Heatmap) theo dõi tổng giờ làm việc hàng tuần của từng nhân sự. Tự động gắn nhãn cảnh báo đỏ "Quá tải" khi tổng thời gian vượt quá 45 giờ/tuần.
- **BR-WRK-15:** Thống kê tỷ lệ hoàn thành KPI đúng hạn của từng nhân viên và gợi ý phân bổ lại công việc cho nhân sự còn trống lịch.

### 2.3. Giám Sát Chấm Công Thời Gian Thực (`/attendance`)
- **BR-HRM-01:** Xác thực tọa độ GPS di động trong bán kính $\le 50\text{m}$ so với văn phòng.
- **BR-HRM-02:** Nhận diện khuôn mặt AI FaceID liveness score $\ge 92\%$.
- **BR-HRM-05:** Cảnh báo đi muộn nếu check-in sau 08:30 sáng quá 15 phút.
- **BR-HRM-14:** Khóa chốt bảng công tự động vào 23:59 ngày mùng 2 hàng tháng.

### 2.4. Phê Duyệt Thanh Toán 3 Cấp (`/payment-approvals`)
- **BR-FIN-01:** Quy trình 3 cấp nghiêm ngặt: Maker (Lập đề xuất) $\rightarrow$ Checker (Kế toán trưởng soát xét) $\rightarrow$ Approver (CFO / CEO phê duyệt).
- **BR-FIN-02:** Phân quyền theo hạn mức:
  - $< 5.000.000$ đ: Trưởng bộ phận.
  - $5.000.000 - 20.000.000$ đ: Giám đốc Tài chính (CFO).
  - $> 20.000.000$ đ: Tổng Giám Đốc (CEO).
- **BR-FIN-06:** Mã VietQR Napas 24/7 gạch nợ tức thì 1 giây sau khi CEO ký số duyệt chi.
- **BR-FIN-07:** Khử trùng lặp hóa đơn tài chính dựa trên số hóa đơn, ngày phát hành và mã số thuế.

---

## 3. CHUẨN HÓA RESTFUL API CHO PHÂN HỆ VẬN HÀNH & GIÁM SÁT DOANH NGHIỆP (`/api/operations`)

Mọi giao tiếp dữ liệu giữa Web CRM, App Mobile ViOne và Backend NestJS tuân thủ nghiêm ngặt quy chuẩn RESTful API:

### 3.1. Danh mục Endpoint & HTTP Methods
| Phân hệ | Endpoint | HTTP Method | HTTP Status | Mục đích & Nghiệp vụ |
| :--- | :--- | :--- | :--- | :--- |
| **Workflow** | `/api/operations/workflow/tasks` | `GET` | `200 OK` | Lấy danh sách nhiệm vụ BPMN (hỗ trợ lọc status, department, assignee) |
| **Workflow** | `/api/operations/workflow/tasks/:id` | `GET` | `200 OK` | Chi tiết công việc theo ID |
| **Workflow** | `/api/operations/workflow/tasks` | `POST` | `201 Created` | Tạo mới công việc (Bắt buộc Assignee & Deadline theo BR-WRK-01; WIP $\le 5$ theo BR-WRK-06) |
| **Workflow** | `/api/operations/workflow/tasks/:id` | `PUT` | `200 OK` | Cập nhật tiến độ / checklist (Chặn Done nếu checklist $< 100\%$ theo BR-WRK-07) |
| **Workflow** | `/api/operations/workflow/tasks/:id` | `DELETE` | `200 OK` | Xóa nhiệm vụ |
| **Workload** | `/api/operations/workload` | `GET` | `200 OK` | Lấy ma trận tải nhân sự, phát hiện cảnh báo đỏ quá tải $> 45\text{h/tuần}$ (BR-WRK-14) |
| **Attendance** | `/api/operations/attendance` | `GET` | `200 OK` | Thống kê bảng công, nhật ký check-in thời gian thực |
| **Attendance** | `/api/operations/attendance/check-in` | `POST` | `201 Created` | Chấm công GPS & AI FaceID (Yêu cầu GPS $\le 50\text{m}$ BR-HRM-01 & FaceScore $\ge 92\%$ BR-HRM-02) |
| **Attendance** | `/api/operations/attendance/leaves` | `GET` | `200 OK` | Danh sách đơn xin nghỉ phép / OT |
| **Attendance** | `/api/operations/attendance/leaves` | `POST` | `201 Created` | Gửi đơn xin nghỉ phép / OT |
| **Attendance** | `/api/operations/attendance/leaves/:id/approve` | `PUT` | `200 OK` | Trưởng bộ phận phê duyệt / từ chối đơn nghỉ |
| **Finance** | `/api/operations/finance/approvals` | `GET` | `200 OK` | Danh sách tờ trình phê duyệt chi 3 cấp |
| **Finance** | `/api/operations/finance/approvals` | `POST` | `201 Created` | Khởi tạo tờ trình chi (Tự động gán thẩm quyền: $< 5\text{M}$ Dept Head, $5-20\text{M}$ CFO, $> 20\text{M}$ CEO theo BR-FIN-02; Kiểm tra trùng hóa đơn BR-FIN-07) |
| **Finance** | `/api/operations/finance/approvals/:id/approve` | `PUT` | `200 OK` | Duyệt tờ trình theo cấp (Checker: Kế toán trưởng $\rightarrow$ Approver: CFO/CEO) |
| **Finance** | `/api/operations/finance/approvals/:id/reject` | `PUT` | `200 OK` | Từ chối tờ trình chi kèm lý do |
| **Finance** | `/api/operations/finance/approvals/:id/qr` | `GET` | `200 OK` | Sinh mã VietQR Napas 24/7 gạch nợ tức thì 1 giây (BR-FIN-06) |

### 3.2. Cấu trúc Response Envelope chuẩn hóa
- **Thành công (Success Response):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "data": { ... },
    "message": "Thông điệp phản hồi (tùy chọn)",
    "count": 4
  }
  ```
- **Lỗi nghiệp vụ / Validation (Error Response):**
  ```json
  {
    "statusCode": 400,
    "success": false,
    "message": "Nội dung lỗi chi tiết bằng tiếng Việt theo quy chuẩn BRD",
    "errors": { "field": "lý do vi phạm" },
    "timestamp": "2026-10-02T06:24:00.000Z",
    "path": "/api/operations/..."
  }
  ```

