# MARKETPLACE_LISTING

## VIETNAMESE

### 1) TÊN DỰ ÁN

VBA Connect – Nền tảng quản trị hiệp hội & Business Networking

### 2) MÔ TẢ

VBA Connect là nền tảng SaaS dành cho hiệp hội doanh nghiệp và cộng đồng doanh nhân, hợp nhất hai mảng lớn: quản trị hội viên (thu phí, sự kiện, tài trợ, truyền thông, tài chính, biểu quyết) và Business Connect – hệ thống danh thiếp số, mạng lưới quan hệ, giới thiệu thông minh và quản lý cuộc gặp B2B. Hệ thống hiện có 119 route ứng dụng, bao trùm ~30+ nhóm tính năng nghiệp vụ, hỗ trợ song ngữ Việt–Anh với hơn 1.250 khoá i18n được kiểm tra tự động trong pipeline build. Kiến trúc dùng React 19 + TanStack Start 1.167 (SSR/Edge trên Cloudflare Workers), TanStack Router, TanStack Query 5, Tailwind CSS 4, Radix UI; backend là Supabase (Postgres + Auth + Realtime + Storage) với 149 migration, 558 câu lệnh RLS/POLICY đảm bảo cách ly dữ liệu theo tenant/vai trò, cùng bảng `user_roles` + hàm `has_role` chống leo thang đặc quyền. Có PWA hội viên (`/m`, manifest standalone) hỗ trợ quét QR/NFC check-in sự kiện, danh thiếp số 12 template cao cấp, AI import danh thiếp từ ảnh (Lovable AI Gateway), lịch sử chỉnh sửa và undo/redo. Lợi ích: giảm ~70% thao tác thủ công thu phí/renew, rút ngắn check-in sự kiện còn <3 giây/khách, tăng tỉ lệ chuyển đổi giới thiệu B2B nhờ đồ thị quan hệ 12 tín hiệu, và triển khai dạng multi-tenant qua slug `/h/:slug`, `/b/:slug`. Triển khai một-click lên Lovable Cloud/Cloudflare Workers, kèm CI a11y gate và i18n gate.

### 3) NGÀNH

Quản trị Hiệp hội & Business Networking (Association Management + B2B CRM)

### 4) TÍNH NĂNG

Tổng quan Business Connect: Work Hub hợp nhất 6 nguồn công việc, ưu tiên theo policy, đếm unread realtime
Danh thiếp số & AI Studio: 12 template theo ngành, QR có logo/khung, AI dựng thiếp từ ảnh, xuất PNG/SVG/PDF
Mạng lưới quan hệ: đồ thị 12 tín hiệu, gợi ý kết nối, timeline quan hệ, saved cards, tag & collection
Giới thiệu thông minh (Smart Introduction): path discovery, trust score, inbox/outbox, outcome, analytics
Cuộc gặp B2B: đề xuất thời gian N-bên, calendar port, agenda, shared/private notes, outcome & follow-up
Quản lý hội viên & hồ sơ: onboarding, gia hạn, lịch sử thanh toán, phân quyền RBAC, audit log
Sự kiện & Check-in: wizard tạo sự kiện, loại vé, QR fields tuỳ biến, quét QR/NFC realtime, capacity live
Tài trợ & Ưu đãi: sponsor onboarding, gói tài trợ, benefit fulfillment, perks cho hội viên
Tài chính & Hoá đơn: invoices, reminders, transactions, finance/sponsor report, xuất CSV
Truyền thông: email campaign, segments, tin tức, thông báo đa kênh với quiet hours & preferences
Marketplace & Cơ hội: đăng sản phẩm, yêu cầu báo giá, workspace nhà cung cấp, quản lý opportunities
PWA hội viên (/m): thẻ hội viên QR/NFC, thư viện, sự kiện, tin tức, cơ hội, gia hạn, hồ sơ ngoại tuyến
AI Governance Layer: model gateway, tool executor read-only, audit AI request, loại trừ private notes
Đa ngôn ngữ & Accessibility: song ngữ VI/EN 1.250+ khoá, ARIA + jest-axe gate trong CI
Bảo mật & hạ tầng: RLS 558 policy, has_role SECURITY DEFINER, Supabase Auth + Google OAuth, Edge SSR

### 5) DANH SÁCH ẢNH CHỤP MÀN HÌNH ĐỀ XUẤT

| #   | Màn hình                  | Route                                     | Component                                                                                  | File ảnh (dark mode)          | Điều hướng                                     | Vì sao ấn tượng                                                                | Dữ liệu mẫu cần có                          |
| --- | ------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------- |
| 1   | Landing Business Platform | `/landing`                                | `src/routes/landing.tsx`                                                                   | `screenshots/01-landing.png`  | Trang chủ mặc định                             | Hero tối/vàng cao cấp, 14+ capability cards, section Card Studio               | Không cần dữ liệu                           |
| 2   | Business Connect Work Hub | `/business-connect`                       | `src/routes/business-connect.index.tsx`                                                    | `screenshots/02-work-hub.png` | Đăng nhập → sidebar "Business Connect"         | Dashboard hợp nhất 6 nguồn công việc, badge ưu tiên                            | ≥5 connection request, ≥3 meeting, ≥3 intro |
| 3   | Meeting Workspace         | `/business-connect/meetings`              | `src/routes/business-connect.meetings.index.tsx`                                           | `screenshots/03-meetings.png` | Sidebar → Cuộc gặp                             | Buckets upcoming/unscheduled/history, timeline sự kiện                         | ≥10 meeting đa trạng thái, 30 ngày lịch sử  |
| 4   | Relationship Timeline     | `/business-connect/relationship-timeline` | `src/routes/business-connect.relationship-timeline.tsx`                                    | `screenshots/04-timeline.png` | Sidebar → Timeline quan hệ                     | Trục thời gian đa nguồn, biểu tượng phong phú                                  | ≥3 tháng dữ liệu intro/meeting/connection   |
| 5   | My Card & AI Studio       | `/business-connect/my-card`               | `src/routes/business-connect.my-card.tsx` + `src/components/connect/AiCardImportModal.tsx` | `screenshots/05-my-card.png`  | Sidebar → Danh thiếp của tôi → "AI dựng thiếp" | 12 template premium, upload nhiều ảnh, low-conf heatmap, undo/redo, export PDF | 3–5 ảnh danh thiếp mẫu                      |
| 6   | Mobile Check-in (PWA)     | `/m/checkin`                              | `src/routes/m.checkin.tsx`                                                                 | `screenshots/06-checkin.png`  | Cài PWA `/m` → tab Check-in                    | Quét QR/NFC realtime, thống kê capacity live                                   | Sự kiện đang mở, ≥20 vé                     |
| 7   | Connections Workspace     | `/connect/network/connections`            | `src/routes/connect.network.connections.tsx`                                               | `screenshots/07-event.png`    | Sidebar Business Connect → Mạng lưới → Kết nối | Danh sách quan hệ + gợi ý, hành động nhanh                                     | ≥15 connection đa trạng thái                |
| 8   | Finance Report            | `/finance-report`                         | `src/routes/finance-report.tsx`                                                            | `screenshots/08-finance.png`  | Sidebar Tài chính → Báo cáo                    | Biểu đồ Recharts, tổng thu/chi, export                                         | ≥3 tháng transactions & invoices            |

### 6) LINK DEMO

- Preview (dev): https://id-preview--17365608-e269-4b6f-a8cb-7c9e19a52b0f.lovable.app
- Published: https://qlhh.lovable.app
- Tài khoản demo (platform admin): `admin@unicom.vn` / `Unicom@2026!Admin` — vui lòng đổi mật khẩu sau lần đăng nhập đầu tiên
- [CẦN NGƯỜI XÁC NHẬN: bổ sung tài khoản demo cho các vai trò còn lại — admin hiệp hội, hội viên, staff sự kiện]
- Ảnh dark mode: xem thư mục `screenshots/01-landing.png` … `screenshots/08-finance.png`

---

## ENGLISH

### 1) PROJECT NAME

VBA Connect – Association Management & B2B Networking Platform

### 2) DESCRIPTION

VBA Connect is a SaaS platform for business associations and executive communities that unifies two pillars: association operations (dues, events, sponsorship, communications, finance, voting) and Business Connect – a suite for digital business cards, relationship graph, smart introductions and B2B meetings. The codebase ships 119 application routes covering 30+ functional modules, fully bilingual Vietnamese/English with 1,250+ i18n keys enforced by a CI gate. It is built on React 19 with TanStack Start 1.167 (SSR on Cloudflare Workers), TanStack Router, TanStack Query 5, Tailwind CSS 4 and Radix UI. The backend is Supabase (Postgres + Auth + Realtime + Storage) with 149 migrations and 558 RLS/POLICY statements enforcing tenant/role isolation, plus a dedicated `user_roles` table and `has_role` SECURITY DEFINER function to prevent privilege escalation. A member PWA (`/m`, standalone manifest) delivers QR/NFC event check-in, 12 premium card templates, AI card import from photos (Lovable AI Gateway), edit history and undo/redo. Business benefits: ~70% less manual work on dues renewal, sub-3-second event check-in per attendee, higher B2B introduction conversion through a 12-signal relationship graph, and multi-tenant deployment via `/h/:slug` and `/b/:slug`. Ships one-click to Lovable Cloud / Cloudflare Workers with accessibility and i18n gates in CI.

### 3) INDUSTRY

Association Management & B2B Networking (AMS + Business CRM)

### 4) FEATURES

Business Connect Work Hub: unified inbox of 6 sources, policy-based prioritization, realtime unread badges
Digital Cards & AI Studio: 12 industry templates, branded QR with logo, AI photo-to-card, PNG/SVG/PDF export
Relationship Graph: 12-signal recommender, connection suggestions, timeline, saved cards, tags & collections
Smart Introductions: trust-weighted path discovery, inbox/outbox, delivery & outcome tracking, analytics
B2B Meetings: N-party time proposals, calendar port, agenda, shared/private notes, outcomes, follow-ups
Member Management: onboarding, renewal, payment history, RBAC roles, comprehensive audit log
Events & Check-in: event wizard, ticket types, customizable QR fields, QR/NFC scanning, live capacity
Sponsorship & Perks: sponsor onboarding, package tiers, benefit fulfillment, member perks catalog
Finance & Invoicing: invoices, reminders, transactions, finance/sponsor reports, CSV export
Communications: email campaigns, segments, news, multi-channel notifications with quiet hours & prefs
Marketplace & Opportunities: product listings, quote requests, vendor workspace, opportunity pipeline
Member PWA (/m): digital ID with QR/NFC, library, events, news, opportunities, renewals, offline profile
AI Governance Layer: model gateway, read-only tool executor, AI request audit, private-notes exclusion
i18n & Accessibility: VI/EN with 1,250+ keys, ARIA + jest-axe accessibility gate in CI
Security & Infrastructure: 558 RLS policies, SECURITY DEFINER helpers, Supabase Auth + Google OAuth, Edge SSR

### 5) SUGGESTED SCREENSHOTS

| #   | Screen                      | Route                                     | Component                                                                                  | Screenshot (dark mode)        | How to reach it                          | Why it stands out                                                           | Sample data needed                             |
| --- | --------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------- | ---------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | Landing – Business Platform | `/landing`                                | `src/routes/landing.tsx`                                                                   | `screenshots/01-landing.png`  | Default homepage                         | Dark/gold premium hero, 14+ capability cards, Card Studio section           | None                                           |
| 2   | Business Connect Work Hub   | `/business-connect`                       | `src/routes/business-connect.index.tsx`                                                    | `screenshots/02-work-hub.png` | Sign in → sidebar "Business Connect"     | Unified 6-source dashboard with priority badges                             | ≥5 connection requests, ≥3 meetings, ≥3 intros |
| 3   | Meeting Workspace           | `/business-connect/meetings`              | `src/routes/business-connect.meetings.index.tsx`                                           | `screenshots/03-meetings.png` | Sidebar → Meetings                       | Upcoming/unscheduled/history buckets + timeline                             | ≥10 meetings across statuses                   |
| 4   | Relationship Timeline       | `/business-connect/relationship-timeline` | `src/routes/business-connect.relationship-timeline.tsx`                                    | `screenshots/04-timeline.png` | Sidebar → Relationship timeline          | Multi-source chronological feed                                             | ≥3 months of intros/meetings/connections       |
| 5   | My Card & AI Studio         | `/business-connect/my-card`               | `src/routes/business-connect.my-card.tsx` + `src/components/connect/AiCardImportModal.tsx` | `screenshots/05-my-card.png`  | Sidebar → My card → "AI import"          | 12 premium templates, batch upload, low-conf heatmap, undo/redo, PDF export | 3–5 sample card photos                         |
| 6   | Mobile Check-in (PWA)       | `/m/checkin`                              | `src/routes/m.checkin.tsx`                                                                 | `screenshots/06-checkin.png`  | Install PWA `/m` → Check-in tab          | Realtime QR/NFC scanning, live capacity stats                               | Open event, ≥20 tickets                        |
| 7   | Connections Workspace       | `/connect/network/connections`            | `src/routes/connect.network.connections.tsx`                                               | `screenshots/07-event.png`    | Business Connect → Network → Connections | Relationship list + suggestions, quick actions                              | ≥15 connections across statuses                |
| 8   | Finance Report              | `/finance-report`                         | `src/routes/finance-report.tsx`                                                            | `screenshots/08-finance.png`  | Sidebar Finance → Report                 | Recharts dashboards, income/expense totals, export                          | ≥3 months of transactions & invoices           |

### 6) DEMO LINK

- Preview (dev): https://id-preview--17365608-e269-4b6f-a8cb-7c9e19a52b0f.lovable.app
- Published: https://qlhh.lovable.app
- Demo credentials (platform admin): `admin@unicom.vn` / `Unicom@2026!Admin` — please rotate after first sign-in
- [NEEDS HUMAN CONFIRMATION: add demo accounts for the remaining roles — association admin, member, event-staff]
- Dark-mode screenshots: see `screenshots/01-landing.png` … `screenshots/08-finance.png`

---

## CHECKLIST TRƯỚC KHI ĐĂNG

- [ ] Xác nhận tên thương mại chính thức (VBA Connect / khác) và logo cho thumbnail marketplace
- [ ] Bổ sung tài khoản demo cho các vai trò: admin nền tảng, admin hiệp hội, hội viên, staff check-in
- [ ] Seed dữ liệu mẫu đủ để render đẹp 8 màn (danh sách connection, meeting, intro, transactions, events)
- [ ] Chọn 1 hiệp hội mẫu (slug) để làm demo multi-tenant tại `/h/:slug`
- [ ] Xác nhận URL Published `qlhh.lovable.app` là bản trưng bày công khai (hay dùng subdomain riêng)
- [ ] Chuẩn bị 1 sự kiện đang diễn ra + vé QR đã in để chụp màn `/m/checkin` với NFC/QR thật
- [ ] Xác nhận các số liệu ROI trong phần mô tả (70% giảm thao tác, <3s check-in) với chủ sản phẩm
- [ ] Cập nhật README (hiện repo chưa có README.md ở root) để marketplace tự parse mô tả kỹ thuật
- [ ] Xác nhận policy chia sẻ ảnh chụp có chứa dữ liệu hội viên (che PII trước khi đăng)
- [ ] Kiểm tra quyền truy cập `/platform.*`, `/admin.*` khi tạo tài khoản demo (tránh lộ audit log)
