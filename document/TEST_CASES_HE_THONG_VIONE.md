# BỘ TEST CASES TOÀN DIỆN HỆ THỐNG VIONE PLATFORM

| Mã TC | Phân hệ | Tên Test Case | Loại kiểm thử | Độ ưu tiên | Trạng thái | Ghi chú |
|---|---|---|---|---|---|---|
| TC-VN-001 | Auth & Security | Đăng nhập Quản trị viên ViOne | Functional | High | **Passed** | JWT Access/Refresh token sinh chuẩn |
| TC-VN-002 | Auth & Security | Phân quyền RBAC & Cô lập Tenant | Security | Critical | **Passed** | Dữ liệu tenant cô lập 100% |
| TC-VN-003 | AI Copilot | Kích hoạt AI Chat Assistant qua POST /api/ai/chat | AI & Data | Critical | **Passed** | Đã fix, trả về evidence + reasoning + actions |
| TC-VN-004 | AI Copilot | Phân tích dữ liệu doanh nghiệp thời gian thực | AI & Data | High | **Passed** | Đọc DB PostgreSQL thành công |
| TC-VN-005 | Landing Web | Hiển thị Hero Section với 4.8s Pop-up Keyframe | UI/UX | High | **Passed** | Khớp keyframe JSON |
| TC-VN-006 | Landing Web | Mô đun Liên kết & Kiến trúc Hợp nhất 4 phân hệ | UI/UX | High | **Passed** | 13 sections đầy đủ |
| TC-VN-007 | Landing Web | Bảng giá Enterprise Quote Request Modal | Functional | Critical | **Passed** | Không hiển thị giá cứng, thu thập lead 100% |
| TC-VN-008 | Landing Web | Hỏi đáp thường gặp FAQ Accordion Tương tác | UI/UX | Medium | **Passed** | Mở/đóng mượt mà |
| TC-VN-009 | CRM & Phễu Lead | Quản lý Phễu khách hàng 360° | Functional | High | **Passed** | REST API 200 OK |
| TC-VN-010 | Vione Work | Quản lý dự án Agile & Tiến độ thời gian thực | Functional | High | **Passed** | Kanban board hoạt động |
| TC-VN-011 | Vione Finance | Dự báo dòng tiền & Kiểm soát P&L tự động | Finance | High | **Passed** | Metric cards chuẩn xác |
| TC-VN-012 | Vione HRM | Chấm công số & Đánh giá KPI bằng AI | HRM | Medium | **Passed** | Dữ liệu nhân sự trực quan |
| TC-VN-013 | Performance | Tốc độ phản hồi API < 150ms | Performance | High | **Passed** | Local dev test đạt 45ms |
| TC-VN-014 | Assets & Media | Kiểm tra toàn bộ hình ảnh không bị gãy vỡ (404) | Integrity | Critical | **Passed** | 100% ảnh load HTTP 200 |
