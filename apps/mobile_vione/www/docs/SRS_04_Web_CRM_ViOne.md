# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & THIẾT KẾ CƠ SỞ DỮ LIỆU

## HỆ ĐIỀU HÀNH QUẢN TRỊ DOANH NGHIỆP VIONE ENTERPRISE CRM

*Phiên bản: Version 3.0 - Bản Chuẩn Hoá Toàn Diện Master BA*

| Mục Quản Trị | Thông Tin Chi Tiết |

| --- | --- |

| Tên Dự Án / Phân Hệ | Hệ Điều Hành Quản Trị Doanh Nghiệp ViOne Enterprise CRM |

| Mã Tài Liệu | SRS-VIONE-ENTERPRISE-CRM-V3.0 |

| Phiên Bản | Version 3.0 - Master BA Comprehensive Standard |

| Tác Giả & Thẩm Định | Master Business Analyst, Solution Architect & ViOne Enterprise Architecture Board |

| Đối Tượng Sử Dụng | Tổng Giám Đốc, Giám Đốc Kinh Doanh (CCO), Quản Lý Bán Hàng, Đội Ngũ Sales B2B, Kế Toán Trưởng |

| Nền Tảng Triển Khai | Web Application (React 19, TypeScript, TanStack Router, Nitro SSR), Port 5000 / 5001 |

| Quy Mô Dữ Liệu | 163 Bảng CSDL Chuẩn Hóa, Kiến Trúc Đa Doanh Nghiệp Cô Lập Hoàn Toàn (tenant_id) |

| Công Nghệ Bảo Mật | Row Level Security (RLS), JWT Session Rotation, Mã Hóa Dữ Liệu AES-256, Audit Logging Bất Biến |

## PHẦN 1: GIẢI THÍCH BÌNH DÂN CÁC KHÁI NIỆM KỸ THUẬT CỐT LÕI

> **HÌNH TƯỢNG VÍ VON ĐỜI THƯỜNG:**
> 1. Multi-Tenant = Tòa chung cư cao cấp mỗi công ty có 1 chìa khóa căn hộ riêng biệt (tenant_id).
> 2. Phễu Bán Hàng = Các bậc thang từ Khách tiềm năng -> Báo giá -> Hợp đồng -> Thu tiền.
> 3. AI Copilot = Cố vấn tài chính túc trực 24/7 cảnh báo rủi ro dòng tiền và nhắc hợp đồng.

## PHẦN 2: QUY CHẾ PHÂN QUYỀN NỘI BỘ DOANH NGHIỆP

| Phân Hệ Chức Năng | Chức Năng Con | Thao Tác Cụ Thể | CEO / Chủ Tịch | Giám Đốc KD (CCO) | Nhân Viên Sales | Kế Toán |

| --- | --- | --- | --- | --- | --- | --- |

| 1. Quản Trị Khách Hàng | Danh sách Khách hàng (Accounts) | Xem, Thêm, Sửa, Xóa | Toàn quyền | Toàn quyền | Chỉ khách của mình | Chỉ Xem |

| 1. Quản Trị Khách Hàng | Xuất File Excel Khách Hàng | Export toàn bộ danh bạ | Toàn quyền | Toàn quyền | Không có quyền | Không có quyền |

| 2. Phễu Bán Hàng (Pipeline) | Kéo thả cơ hội (Deals Kanban) | Chuyển giai đoạn thương vụ | Toàn quyền | Toàn quyền | Deals của mình | Chỉ Xem |

| 2. Phễu Bán Hàng (Pipeline) | Phân bổ Leads cho nhân viên | Gán nhân sự chăm sóc khách | Toàn quyền | Toàn quyền | Không có quyền | Không có quyền |

| 3. Báo Giá & Hợp Đồng | Tạo Báo Giá B2B (Quotation) | Soạn báo giá có chiết khấu | Toàn quyền | Toàn quyền | Soạn báo giá | Chỉ Xem |

| 3. Báo Giá & Hợp Đồng | Phê Duyệt Báo Giá / Hợp Đồng | Ký số và duyệt phát hành | Duyệt mọi deal | Duyệt deal < 1 tỷ | Không có quyền | Không có quyền |

| 4. Tài Chính & Hóa Đơn | Phát hành Hóa đơn VietQR | Sinh hóa đơn kèm mã QR thanh toán | Toàn quyền | Chỉ Xem | Không có quyền | Toàn quyền |

| 4. Tài Chính & Hóa Đơn | Gạch nợ & Đối soát dòng tiền | Xác nhận tiền về tài khoản ngân hàng | Toàn quyền | Chỉ Xem | Không có quyền | Toàn quyền |

| 5. AI Copilot Điều Hành | Báo cáo dự báo doanh thu AI | Xem phân tích rủi ro & cơ hội | Toàn quyền | Xem báo cáo sales | Không có quyền | Xem báo cáo thu chi |

## PHẦN 5: KỊCH BẢN KIỂM THỬ NGHIỆM THU (ENTERPRISE CRM UAT)

| Mã Test Case | Tên Nghiệp Vụ | Thao Tác Thực Hiện | Kỳ Vọng Kỹ Thuật | Kỳ Vọng Giao Diện |

| --- | --- | --- | --- | --- |

| TC_CRM_ENT_01 | Cô lập dữ liệu giữa 2 công ty | User Công ty A tra cứu khách hàng | Chỉ trả về các bản ghi có tenant_id của Công ty A | Không nhìn thấy bất kỳ dữ liệu nào của Công ty B |

| TC_CRM_ENT_02 | Kéo thả Deal trên Kanban | Kéo thẻ thương vụ từ "Báo giá" sang "Chốt" | PUT /api/crm/deals/:id/stage cập nhật stage_id mới | Thẻ chuyển cột mượt mà, tổng doanh thu dự kiến nhảy số |

| TC_CRM_ENT_03 | Tạo Báo Giá có chiết khấu | Thêm 3 sản phẩm, nhập chiết khấu 10% | Tính chính xác: Tổng = Tiền hàng - Chiết khấu + VAT | Bản xem trước PDF chuẩn hóa mẫu doanh nghiệp |

| TC_CRM_ENT_04 | Thanh toán VietQR Napas 24/7 | Khách quét VietQR chuyển tiền ngân hàng | Webhook ngân hàng kích hoạt gạch nợ tự động | Hóa đơn đổi trạng thái Đã Thanh Toán tức thì |

