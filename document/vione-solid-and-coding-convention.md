# QUY CHUẨN MÃ NGUỒN & NGUYÊN TẮC THIẾT KẾ SOLID HỆ THỐNG VIONE
## VIONE ECOSYSTEM — SOLID PRINCIPLES & CODE CONVENTION GUIDELINES
*Bộ Quy chuẩn Phát triển Phần mềm Chất lượng Cao Dành cho Đội ngũ Kỹ sư Frontend, Backend và Mobile*

---

## 📌 THÔNG TIN TÀI LIỆU & LỊCH SỬ PHIÊN BẢN

*   **Tên tài liệu:** Nguyên tắc Thiết kế SOLID & Quy chuẩn Mã nguồn Dự án ViOne
*   **Mã tài liệu:** `VIONE-SOLID-CODING-06`
*   **Phiên bản:** `3.0.0` (Master BA & SA Edition)
*   **Chủ trì biên soạn:** Ban Công nghệ & Kỹ nghệ Phần mềm ViOne (Software Engineering Board)
*   **Trạng thái:** Đã phê duyệt & Ban hành áp dụng bắt buộc (Mandatory Baseline)

---

## 📑 MỤC LỤC TỔNG THỂ

1. [ỨNG DỤNG NGUYÊN TẮC SOLID TRONG KIẾN TRÚC VIONE](#1-ứng-dụng-nguyên-tắc-solid-trong-kiến-trúc-vione)
   - 1.1 Single Responsibility Principle (S - Đơn Trách Nhiệm)
   - 1.2 Open/Closed Principle (O - Đóng/Mở Mở Rộng)
   - 1.3 Liskov Substitution Principle (L - Thay Thế Liskov)
   - 1.4 Interface Segregation Principle (I - Phân Tách Giao Diện)
   - 1.5 Dependency Inversion Principle (D - Đảo Ngược Phụ Thuộc)
2. [QUY CHUẨN MÃ NGUỒN FRONTEND & TANSTACK ROUTER](#2-quy-chuẩn-mã-nguồn-frontend--tanstack-router)
   - 2.1 Quy chuẩn Đặt tên Tệp Tuyến đường (File-based Routing Conventions)
   - 2.2 Tách biệt Logic & Giao diện (Hooks vs Components)
   - 2.3 Quản lý State & Caching với TanStack Query
3. [QUY CHUẨN MÃ NGUỒN BACKEND NESTJS & PRISMA ORM](#3-quy-chuẩn-mã-nguồn-backend-nestjs--prisma-orm)
   - 3.1 Cấu trúc Module Chuẩn (Controller - Service - DTO - Entity)
   - 3.2 Tối ưu Hóa Truy vấn Cơ sở dữ liệu & Chống N+1 Query
   - 3.3 Quản lý Giao dịch Nguyên tử (ACID Transactions)
4. [QUY CHUẨN BẢO MẬT & XỬ LÝ LỖI TOÀN HỆ THỐNG](#4-quy-chuẩn-bảo-mật--xử-lý-lỗi-toàn-hệ-thống)

---

# 1. ỨNG DỤNG NGUYÊN TẮC SOLID TRONG KIẾN TRÚC VIONE

Hệ sinh thái ViOne được xây dựng dựa trên 5 nguyên tắc vàng của kỹ nghệ phần mềm hướng đối tượng:

## 1.1 Single Responsibility Principle (S - Đơn Trách Nhiệm)
- **Định nghĩa**: Một Class / Module / Component chỉ nên có một lý do duy nhất để thay đổi.
- **Áp dụng trong ViOne**:
  - `MemberService`: Chỉ xử lý logic nghiệp vụ hội viên (tạo mới, đổi trạng thái, cập nhật thông tin). Tuyệt đối không xử lý tạo mã QR hay gửi email.
  - `QrCodeGeneratorService`: Chỉ chịu trách nhiệm duy nhất là mã hóa chuỗi payload thành hình ảnh QR dạng Data URL hoặc SVG.
  - `NotificationDispatcherService`: Chỉ chịu trách nhiệm phân phối thông báo (Push Notification, Socket, Email).

## 1.2 Open/Closed Principle (O - Đóng/Mở Mở Rộng)
- **Định nghĩa**: Phần mềm nên mở cho việc mở rộng (Open for extension) nhưng đóng cho việc sửa đổi mã nguồn gốc (Closed for modification).
- **Áp dụng trong ViOne**:
  - Hệ thống Cổng thanh toán (Payment Gateway): Thiết kế theo mô hình Strategy Pattern thông qua interface `IPaymentProvider`. Khi hiệp hội muốn tích hợp thêm VNPay hay MoMo bên cạnh VietQR Napas 247, kỹ sư chỉ cần viết thêm class `VnPayProvider implements IPaymentProvider` mà không cần sửa đổi một dòng code nào trong `RenewalService`.

## 1.3 Liskov Substitution Principle (L - Thay Thế Liskov)
- **Định nghĩa**: Các lớp con hoặc lớp triển khai phải có khả năng thay thế hoàn toàn cho lớp cha/interface mà không làm hỏng tính đúng đắn của chương trình.
- **Áp dụng trong ViOne**:
  - Cả `VietQrProvider` và `BankTransferProvider` đều phải thực thi đúng phương thức `verifyTransaction(ref: string): Promise<PaymentResult>`. Kết quả trả về phải luôn tuân thủ cấu trúc `{ isSuccess: boolean, amount: number, transactionId: string }`.

## 1.4 Interface Segregation Principle (I - Phân Tách Giao Diện)
- **Định nghĩa**: Không bao giờ ép buộc một Class phải triển khai các phương thức mà nó không sử dụng.
- **Áp dụng trong ViOne**:
  - Thay vì tạo một interface khổng lồ `IUserOperations` chứa cả điểm danh sự kiện, GIA HẠN HỘI PHÍ và gửi tin nhắn, hệ thống phân tách thành:
    - `ICheckinScanner`: Dành riêng cho thiết bị lễ tân quét QR.
    - `IRenewalHandler`: Dành riêng cho phân hệ kế toán thu phí.
    - `IMessagingClient`: Dành riêng cho phân hệ chat B2B.

## 1.5 Dependency Inversion Principle (D - Đảo Ngược Phụ Thuộc)
- **Định nghĩa**: Các module cấp cao không nên phụ thuộc vào module cấp thấp; cả hai nên phụ thuộc vào các Abstraction (Interfaces).
- **Áp dụng trong ViOne**:
  - `EventCheckinController` phụ thuộc vào `IEventRegistrationRepository` thông qua cơ chế Dependency Injection của NestJS chứ không trực tiếp khởi tạo PrismaClient trong Controller.

---

# 2. QUY CHUẨN MÃ NGUỒN FRONTEND & TANSTACK ROUTER

## 2.1 Quy chuẩn Đặt tên Tệp Tuyến đường (File-based Routing Conventions)
1. **Quy chuẩn Kebab-case Chữ Thường**:
   - Tất cả các tệp trong `apps/vione_app_fe/src/routes/` phải được đặt tên bằng chữ thường, phân tách bằng dấu chấm (`.`) cho các route lồng nhau.
   - Ví dụ đúng: `auth.mobile.tsx`, `association.news.tsx`, `association.events.tsx`, `association.card.tsx`.
   - Nghiêm cấm: `Auth.Mobile.tsx`, `m_news.tsx`, `AssociationEvents.tsx`.
2. **Cấu trúc Tuyến đường Đã Chuẩn Hóa**:
   - Đăng nhập Mobile: `routes/auth.mobile.tsx` (Route: `/auth/mobile`)
   - Ứng dụng Hiệp hội: `routes/association.*.tsx` (24 routes con tương ứng)
   - Tuyến đường cũ chuyển tiếp: `routes/m.tsx` (Tự động 301 Redirect sang `/association/*`)
3. **Sinh tự động Cây tuyến đường (`routeTree.gen.ts`)**:
   - Mỗi khi thêm hoặc đổi tên route, bắt buộc chạy `npm run routes:gen` để cập nhật `routeTree.gen.ts`.
   - Nghiêm cấm sửa thủ công tệp `routeTree.gen.ts`.

## 2.2 Tách biệt Logic & Giao diện (Hooks vs Components)
- Mọi logic gọi API, tính toán ngày hết hạn, hoặc chuyển trạng thái phải được đưa vào Custom Hooks (ví dụ `useMemberRenewal.ts`, `useEventCheckin.ts`).
- File UI Component (TSX) chỉ chịu trách nhiệm hiển thị giao diện và bắt sự kiện người dùng, không chứa các câu lệnh `fetch` hay tính toán phức tạp.

## 2.3 Quản lý State & Caching với TanStack Query
- Mọi dữ liệu từ Backend phải được quản lý qua `useQuery` và `useMutation`.
- Thời gian `staleTime` mặc định: 5 phút đối với danh bạ hội viên; 10 giây đối với danh sách vé check-in sự kiện; không cache đối với kết quả thanh toán hội phí.

---

# 3. QUY CHUẨN MÃ NGUỒN BACKEND NESTJS & PRISMA ORM

## 3.1 Cấu trúc Module Chuẩn
Mỗi phân hệ trong `apps/vione_app_be` phải bao gồm đầy đủ 4 thành phần:
```
modules/association-renewal/
├── dto/
│   ├── create-invoice.dto.ts        # Validation dữ liệu đầu vào bằng class-validator
│   └── payment-webhook.dto.ts
├── entities/
│   └── renewal-audit.entity.ts      # Định nghĩa cấu trúc dữ liệu
├── association-renewal.controller.ts # Tiếp nhận HTTP request & kiểm tra RBAC
├── association-renewal.service.ts    # Thực thi logic nghiệp vụ & ACID transactions
└── association-renewal.module.ts     # Đăng ký Providers & Exports
```

## 3.2 Tối ưu Hóa Truy vấn Cơ sở dữ liệu & Chống N+1 Query
- **Quy tắc**: Tuyệt đối không dùng vòng lặp `for` để gọi câu lệnh truy vấn CSDL cho từng phần tử.
- **Giải pháp**:
  - Sử dụng `prisma.members.findMany({ include: { invoices: true } })` để JOIN dữ liệu trong 1 câu lệnh duy nhất.
  - Luôn đánh chỉ mục (Index) trên các cột thường xuyên tìm kiếm và lọc: `association_id`, `status`, `term_end`, `code`.

## 3.3 Quản lý Giao dịch Nguyên tử (ACID Transactions)
- Đối với các thao tác liên quan đến tiền bạc hoặc thay đổi trạng thái hội viên, bắt buộc sử dụng `prisma.$transaction([ ... ])`.
- Nếu có bất kỳ bước nào thất bại (ví dụ ghi log kiểm toán lỗi), toàn bộ giao dịch phải được Rollback ngay lập tức để bảo đảm tính toàn vẹn số liệu tài chính.

---

# 4. QUY CHUẨN BẢO MẬT & XỬ LÝ LỖI TOÀN HỆ THỐNG

1. **Không bao giờ hiển thị Lỗi Thô (Raw Stack Traces) cho Người dùng**:
   - Mọi exception tại Backend phải được bọc qua `HttpExceptionFilter` chuẩn, chỉ trả về JSON có cấu trúc `{ statusCode, message, timestamp }`.
2. **Khử nhiễm Dữ liệu Đầu vào (Sanitization)**:
   - Sử dụng `DOMPurify` trên Frontend trước khi hiển thị nội dung bài viết tin tức dạng HTML để chống tấn công XSS.
3. **Mã hóa Mật khẩu**:
   - Sử dụng thuật toán `bcrypt` với muối (Salt Rounds) tối thiểu 10 đối với toàn bộ mật khẩu người dùng.
4. **Không bao giờ Commit Bí mật (Secrets)**:
   - Mọi khóa bí mật (JWT Secret, API Key VietQR, Database Password) bắt buộc lưu trong file `.env` và đã được đưa vào `.gitignore`.
