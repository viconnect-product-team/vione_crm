# NGUYÊN TẮC & KỸ NĂNG THIẾT KẾ SA/BA DỰ ÁN VIONE
## VIONE BUSINESS CONNECT ECOSYSTEM — SA & BA RULES & SKILLS GUIDELINES

---

## 📌 TRANG BÌA & THÔNG TIN DỰ ÁN

*   **Tên dự án:** Hệ thống Kết nối và Số hóa Doanh nghiệp ViOne (ViOne Business Connect Ecosystem)
*   **Tên tài liệu:** Nguyên tắc & Kỹ năng Thiết kế SA/BA Dự án ViOne (SA & BA Rules, Traceability & Architectural Standards)
*   **Mã tài liệu:** `VIONE-SA-BA-03`
*   **Phiên bản:** `2.0.0`
*   **Ngày ban hành:** 08/09/2026
*   **Bộ phận biên soạn:** Phòng Nghiệp vụ & Kiến trúc Hệ thống (Senior BA/SA Team)
*   **Trạng thái:** Đã phê duyệt & Ban hành chính thức (Approved & Baseline)
*   **Mức độ bảo mật:** Nội bộ (Internal Confidential)

### Lịch sử Thay đổi Phiên bản

| Phiên bản | Ngày | Tác giả | Trạng thái | Nội dung thay đổi |
| :--- | :--- | :--- | :--- | :--- |
| **0.1.0** | 24/08/2026 | BA/SA Team | Nháp | Định hình vai trò BA/SA và phương pháp ánh xạ truy vết code. |
| **1.0.0** | 28/08/2026 | BA/SA Lead | Phê duyệt | Bổ sung quy định quản lý transaction, phân trang cursor, và checklist bàn giao. |
| **2.0.0** | 08/09/2026 | Senior BA/SA Lead | Phát hành | Nâng cấp toàn diện tiêu chuẩn Senior BA/SA: Phân định ranh giới miền nghiệp vụ vs kiến trúc hệ thống, Chuỗi truy vết 5 cấp độ `@CODE-MEMORY`, Quy chuẩn Prisma `$transaction` chống tranh chấp dữ liệu, Giải thuật phân trang Cursor O(1), Bảng danh mục mã lỗi chuẩn hóa và Bộ Cổng từ chối bàn giao (Reject Gates) nghiêm ngặt. |

---

## 📑 MỤC LỤC TỔNG THỂ

1. [PHẦN 1: PHÂN ĐỊNH RANH GIỚI TRÁCH NHIỆM (BA VS SA BOUNDARIES)](#phần-1-phân-định-ranh-giới-trách-nhiệm-ba-vs-sa-boundaries)
   - 1.1 Ma trận Phân định Trách nhiệm (RACI Matrix)
   - 1.2 Các Hành vi Cấm kỵ (Anti-patterns & Violations)
2. [PHẦN 2: PHƯƠNG PHÁP TRUY VẾT 5 CẤP ĐỘ & CHÚ THÍCH @CODE-MEMORY](#phần-2-phương-pháp-truy-vết-5-cấp-độ--chú-thích-code-memory)
   - 2.1 Chuỗi Khóa Ánh xạ Liên tục (End-to-End Traceability Chain)
   - 2.2 Quy chuẩn Cấu trúc `@CODE-MEMORY` trong Mã nguồn
   - 2.3 Ví dụ Hiện thực `@CODE-MEMORY` trên Toàn bộ các Tầng
3. [PHẦN 3: TIÊU CHUẨN THIẾT KẾ KIẾN TRÚC HỆ THỐNG (SENIOR SA STANDARDS)](#phần-3-tiêu-chuẩn-thiết-kế-kiến-trúc-hệ-thống)
   - 3.1 Quản trị Giao dịch Cơ sở Dữ liệu (Prisma Database Transactions & ACID)
   - 3.2 Chuẩn Phân trang Danh sách Hiệu năng cao (Cursor-based Pagination)
   - 3.3 Danh mục Mã lỗi Nghiệp vụ Thống nhất (Unified Error Code Catalog)
   - 3.4 Quy chuẩn Tích hợp Native Bridge (Android NFC Foreground & Live Camera)
4. [PHẦN 4: BỘ CỔNG KIỂM SOÁT CHẤT LƯỢNG & CHECKLIST BÀN GIAO (REJECT GATES)](#phần-4-bộ-cổng-kiểm-soát-chất-lượng--checklist-bàn-giao)
   - 4.1 Danh mục Cổng Từ chối Nghiệp vụ & Kỹ thuật (Reject Gates Catalog)
   - 4.2 Biên bản Ký xác nhận Bàn giao (SA/BA Handoff Protocol)

---

# PHẦN 1: PHÂN ĐỊNH RANH GIỚI TRÁCH NHIỆM (BA VS SA BOUNDARIES)

Để hệ thống vận hành trơn tru và loại bỏ hoàn toàn các tranh cãi kỹ thuật giữa các nhóm phát triển, ranh giới trách nhiệm giữa **Business Analyst (BA)** và **Solution Architect (SA)** trong dự án ViOne được quy định tuyệt đối:

## 1.1 Ma trận Phân định Trách nhiệm (RACI Matrix)

```
+---------------------------------------------------------------------------------------+
|                                BA vs SA RACI MATRIX                                   |
+---------------------------------------------------------------------------------------+
| Hạng mục Công việc                      | Business Analyst (BA) | Solution Architect (SA) |
+-----------------------------------------+-----------------------+-----------------------+
| Khảo sát Yêu cầu Khách hàng / Hiệp hội  | R (Chịu trách nhiệm)  | C (Tham vấn)          |
| Viết Tài liệu BRD & SRS (Use Cases, BR) | R (Chịu trách nhiệm)  | A (Phê duyệt kỹ thuật)|
| Thiết kế Luồng Nghiệp vụ (Activity Flow)| R (Chịu trách nhiệm)  | C (Tham vấn)          |
| Thiết kế Cơ sở Dữ liệu (ERD, DDL Schema)| C (Tham vấn nghiệp vụ)| R (Chịu trách nhiệm)  |
| Thiết kế REST API Contract & WebSocket  | I (Được thông báo)    | R (Chịu trách nhiệm)  |
| Tối ưu Hiệu năng, Caching & Concurrency | I (Được thông báo)    | R (Chịu trách nhiệm)  |
| Kiểm thử Nghiệp vụ (UAT / Functional)   | R (Chịu trách nhiệm)  | C (Hỗ trợ môi trường) |
+---------------------------------------------------------------------------------------+
(R = Responsible, A = Accountable, C = Consulted, I = Informed)
```

## 1.2 Các Hành vi Cấm kỵ (Anti-patterns & Violations)

### 🚫 Cấm đối với Business Analyst (BA):
1. **BA tự ý thiết kế kỹ thuật (Technical Overreach)**: BA không được chỉ định tên bảng DB, tên cột DB, tên method class, hoặc bắt buộc cấu trúc JSON payload trong SRS. BA chỉ mô tả các trường thông tin nghiệp vụ và quy tắc logic.
2. **Bỏ qua luồng Exception (Happy Path Only)**: BA chỉ viết luồng thành công mà không đặc tả các tình huống lỗi (ví dụ: trùng lịch họp, quá sức chứa sự kiện, thẻ NFC bị vô hiệu hóa). Mọi Use Case bắt buộc phải có tối thiểu 3 kịch bản Exception.
3. **Mô tả mơ hồ, dùng từ định tính**: Tuyệt đối không dùng các từ như "hệ thống xử lý nhanh chóng", "giao diện đẹp mắt", "bảo mật cao" mà không có tiêu chí đo lường cụ thể (SLAs/KPIs).

### 🚫 Cấm đối với Solution Architect (SA):
1. **Đẩy logic nghiệp vụ cho Frontend (Leaky Backend Logic)**: SA không được ném dữ liệu thô từ Database (raw Prisma entity dump) bắt Frontend tự join hoặc tự tính toán công thức doanh thu/hội phí. Backend phải trả về dữ liệu **display-ready**.
2. **Vi phạm Đóng gói Dữ liệu (Direct Table Coupling)**: SA không được để các Controller gọi thẳng Database query mà không đi qua tầng Service và Repository Interface.
3. **Thiếu mã liên kết `ref_srs`**: Mọi bảng DB và API endpoint do SA thiết kế mà không có mã tham chiếu `ref_srs` trỏ về Use Case của BA sẽ bị từ chối nghiệm thu.

---

# PHẦN 2: PHƯƠNG PHÁP TRUY VẾT 5 CẤP ĐỘ & CHÚ THÍCH @CODE-MEMORY

Mục tiêu của cơ chế truy vết (Traceability) là đảm bảo: Bất kỳ lập trình viên, QA tester hoặc AI Sub-agent nào khi nhìn vào một dòng code đều có thể lần ngược lại chính xác lý do kinh doanh và tài liệu đặc tả ban đầu.

## 2.1 Chuỗi Khóa Ánh xạ Liên tục (End-to-End Traceability Chain)

```
[BRD Mục tiêu Chiến lược] 
       │
       ▼
[SRS Use Case (UC-XXX) & Business Rules (BR-XXX)]
       │
       ▼
[TechSpec API Contract & DB Schema (ref_srs: UC-XXX)]
       │
       ▼
[Source Code Header Annotation (@CODE-MEMORY)]
       │
       ▼
[QA Test Cases (TC-XXX) & Automation Tests]
```

## 2.2 Quy chuẩn Cấu trúc `@CODE-MEMORY` trong Mã nguồn

Mọi file mã nguồn chứa logic nghiệp vụ, API handler, database migration hoặc UI component tương tác **bắt buộc** phải có khối chú thích ở dòng đầu tiên:

```typescript
// @CODE-MEMORY
// UseCase: <MÃ_USE_CASE> (<Tên Use Case Tiếng Việt>)
// BusinessRules: <MÃ_LUẬT_1> (<Mô tả ngắn>), <MÃ_LUẬT_2>
// TechSpecRef: <MÃ_API_HOẶC_BẢNG_CSDL> (Method & Endpoint)
// Author: Senior BA/SA Team
// Version: 2.0.0
// LastUpdated: 2026-09-08
```

## 2.3 Ví dụ Hiện thực `@CODE-MEMORY` trên Toàn bộ các Tầng

### 1. Tầng Backend Controller (`apps/vione_app_be/src/modules/meetings/meetings.controller.ts`)
```typescript
// @CODE-MEMORY
// UseCase: UC-MTG-06 (Lập kế hoạch & Điều phối Lịch hẹn Giao thương 1-on-1)
// BusinessRules: BR-MTG-01 (Thời lượng hẹn từ 15m - 8h), BR-MTG-02 (Tối đa 3 khung giờ đề xuất)
// TechSpecRef: API-MTG-01 (POST /api/v1/meetings/propose)
// Author: Senior SA Team

@Post('propose')
@UseGuards(JwtAuthGuard, RolesGuard)
async proposeMeeting(
  @CurrentUser() user: UserEntity,
  @Body() dto: ProposeMeetingDto,
): Promise<MeetingResponseDto> {
  return this.meetingsService.createProposal(user.id, dto);
}
```

### 2. Tầng Backend Service (`apps/vione_app_be/src/modules/members/members.service.ts`)
```typescript
// @CODE-MEMORY
// UseCase: UC-MEM-08 (Quy trình Thẩm định & Phê duyệt Đơn gia nhập CLB)
// BusinessRules: BR-MEM-01 (Định dạng mã hội viên duy nhất), BR-MEM-02 (Tự động kích hoạt tài khoản)
// TechSpecRef: TABLE: members, users, person_nodes
// Author: Senior SA Team

async approveMember(adminId: string, memberId: string, dto: ApproveMemberDto) {
  return this.prisma.$transaction(async (tx) => {
    // 1. Kiểm tra tồn tại hồ sơ
    const member = await tx.member.findUnique({ where: { id: memberId } });
    if (!member || member.status !== MemberStatus.PENDING) {
      throw new BusinessException('MEMBER_NOT_IN_PENDING_STATE', HttpStatus.CONFLICT);
    }
    // 2. Cập nhật trạng thái và cấp mã
    return tx.member.update({
      where: { id: memberId },
      data: {
        status: MemberStatus.APPROVED,
        memberCode: dto.memberCode,
        approvedAt: new Date(),
        approvedBy: adminId,
      },
    });
  });
}
```

### 3. Tầng Frontend Component (`apps/vione_app_fe/src/components/business-connect/mobile/ScannerModal.tsx`)
```typescript
// @CODE-MEMORY
// UseCase: UC-NFC-03 (Chạm kết nối 1-Tap NFC & Quét QR trực tiếp Live Camera)
// BusinessRules: BR-NFC-02 (Tự động nhận diện URL vione.app/c/...), BR-NFC-03 (Phản hồi rung Haptic)
// TechSpecRef: UI-COMP-M04 (ScannerModal Live QR & OCR)
// Author: Senior UI/UX & FE Team

export function ScannerModal({ isOpen, onClose, onScanSuccess }: ScannerModalProps) {
  // Logic Live Camera & Canvas scanning...
}
```

---

# PHẦN 3: TIÊU CHUẨN THIẾT KẾ KIẾN TRÚC HỆ THỐNG (SENIOR SA STANDARDS)

## 3.1 Quản trị Giao dịch Cơ sở Dữ liệu (Prisma Transactions & ACID)
*   **Quy tắc Bắt buộc**: Mọi hành động làm thay đổi dữ liệu từ 2 bảng CSDL trở lên hoặc có ràng buộc toàn vẹn logic bắt buộc phải bọc trong `this.prisma.$transaction(async (tx) => { ... })`.
*   **Các kịch bản Bắt buộc Transaction trong ViOne:**
    1.  **Phê duyệt Đơn gia nhập Hội viên (`UC-MEM-08`)**: Cập nhật trạng thái bảng `members` -> Sinh mã hội viên `member_code` -> Cập nhật Role tài khoản bảng `users` -> Khởi tạo node danh bạ trong `person_nodes` -> Ghi log kiểm toán `audit_logs`.
    2.  **Đề xuất & Chốt lịch hẹn 1-on-1 (`UC-MTG-06`)**: Tạo bản ghi `business_meetings` -> Tạo danh sách khung giờ `business_meeting_proposals` -> Khóa kiểm tra trùng lịch (Time slot conflict lock).
    3.  **Đăng ký & Check-in Sự kiện (`UC-EVT-07`)**: Đọc số lượng vé đã phát hành -> Kiểm tra `currentSeats < maxCapacity` -> Tạo bản ghi vé `event_registrations` -> Cập nhật số ghế còn lại.
*   **Xử lý Tranh chấp Dữ liệu (Concurrency & Race Condition)**: Sử dụng kỹ thuật Optimistic Locking hoặc Khóa chọn lọc cấp Transaction để ngăn chặn trường hợp 2 hội viên cùng đăng ký chỗ ngồi cuối cùng cùng một mili giây.

## 3.2 Chuẩn Phân trang Danh sách Hiệu năng cao (Cursor-based Pagination)
Nhằm đảm bảo hiệu năng tối ưu trên thiết bị di động với hàng chục nghìn hội viên và tin bài B2B, hệ thống nghiêm cấm sử dụng `OFFSET / LIMIT` cho các danh sách thời gian thực (Feed, Cuộc họp, Tin nhắn, Danh bạ).

```
+---------------------------------------------------------------------------------------+
|                            CURSOR PAGINATION MECHANISM                                |
+---------------------------------------------------------------------------------------+
|  Request:  GET /api/v1/b2b/opportunities?limit=10&cursor=eyJpZCI6Ijk5OSIsImNyZ...     |
|                                                                                       |
|  Decode:   { id: "opp_999", createdAt: "2026-09-08T10:00:00.000Z" }                   |
|                                                                                       |
|  SQL Exec: SELECT * FROM b2b_opportunities                                            |
|            WHERE (created_at, id) < ('2026-09-08 10:00:00', 'opp_999')               |
|            ORDER BY created_at DESC, id DESC                                          |
|            LIMIT 10;                                                                  |
|                                                                                       |
|  Response: { items: [...], nextCursor: "eyJpZCI6Ijg4OCIsImNyZ...", hasMore: true }   |
+---------------------------------------------------------------------------------------+
```

## 3.3 Danh mục Mã lỗi Nghiệp vụ Thống nhất (Unified Error Code Catalog)

Mọi Exception ném ra từ Backend phải tuân thủ chuẩn cấu trúc JSON:
```json
{
  "statusCode": 409,
  "errorCode": "MEETING_TIME_CONFLICT",
  "message": "Khung giờ cuộc họp đề xuất bị trùng lặp với lịch hẹn đã chốt của đối tác.",
  "timestamp": "2026-09-08T14:30:00.000Z",
  "path": "/api/v1/meetings/propose",
  "details": {
    "conflictingMeetingId": "mtg_123",
    "conflictingTime": "2026-09-15T09:00:00Z"
  }
}
```

### Bảng Mã lỗi Nghiệp vụ Cốt lõi:

| Mã Lỗi (Error Code) | HTTP Status | Mô tả Nghiệp vụ & Hướng dẫn FE Xử lý |
| :--- | :--- | :--- |
| `AUTH_INVALID_CREDENTIALS` | 401 Unauthorized | Sai email hoặc mật khẩu. FE hiện thông báo đỏ dưới ô nhập. |
| `AUTH_TOKEN_EXPIRED` | 401 Unauthorized | JWT hết hạn. FE tự động kích hoạt Refresh Token hoặc điều hướng về Login. |
| `DEVICE_SESSION_REVOKED` | 401 Unauthorized | Phiên đăng nhập bị đăng xuất từ xa. FE xóa bộ nhớ đệm và logout ngay. |
| `MEMBER_NOT_APPROVED` | 403 Forbidden | Tài khoản đang chờ duyệt. FE điều hướng sang màn hình thông báo chờ xét duyệt. |
| `MEMBER_CODE_DUPLICATED` | 409 Conflict | Mã hội viên đã tồn tại. BE bắt buộc Admin chọn mã khác. |
| `MEETING_TIME_CONFLICT` | 409 Conflict | Đối tác đã có lịch hẹn khác vào khung giờ này. FE yêu cầu chọn giờ khác. |
| `MEETING_PROPOSAL_EXPIRED` | 400 Bad Request | Lời mời hẹn đã quá thời hạn phản hồi. |
| `EVENT_FULL_CAPACITY` | 403 Forbidden | Sự kiện đã hết chỗ đăng ký. FE hiển thị popup thông báo và nút "Đăng ký vào danh sách chờ". |
| `EVENT_ALREADY_CHECKED_IN` | 409 Conflict | Mã vé đã được check-in trước đó. Màn hình quét QR báo động đỏ. |
| `B2B_OPPORTUNITY_EXPIRED` | 400 Bad Request | Tin giao thương B2B đã đóng hoặc hết hạn đăng ký kết nối. |
| `OCR_LOW_CONFIDENCE` | 422 Unprocessable | Ảnh danh thiếp mờ, không nhận diện được chữ. FE gợi ý chụp lại ở nơi đủ ánh sáng. |

## 3.4 Quy chuẩn Tích hợp Native Bridge (Android NFC & Camera Scanner)
*   **Android NFC Foreground Dispatch**: Khi ứng dụng mở `TapToConnectSheet`, Capacitor Plugin kích hoạt `enableForegroundDispatch` để bắt ngay lập tức các Tag `NDEF_DISCOVERED` hoặc `TECH_DISCOVERED` mà không bị hệ điều hành Android mở ứng dụng ngoài.
*   **Camera Permission Fallback**: Nếu người dùng từ chối quyền truy cập Camera, hệ thống không được dừng lại mà phải hiển thị Fallback View: Hướng dẫn người dùng vào Cài đặt cấp quyền kèm nút chọn ảnh tải lên từ Thư viện.

---

# PHẦN 4: BỘ CỔNG KIỂM SOÁT CHẤT LƯỢNG & CHECKLIST BÀN GIAO (REJECT GATES)

## 4.1 Danh mục Cổng Từ chối Nghiệp vụ & Kỹ thuật (Reject Gates Catalog)

Bất kỳ tài liệu hoặc Pull Request nào vi phạm các cổng dưới đây sẽ bị **REJECT NGAY LẬP TỨC (NO-GO)**:

```
+---------------------------------------------------------------------------------------+
|                               QUALITY REJECT GATES                                    |
+---------------------------------------------------------------------------------------+
| MÃ CỔNG  | LOẠI VI PHẠM                                             | MỨC ĐỘ  | XỬ LÝ |
+----------+----------------------------------------------------------+---------+-------+
| R-BA-01  | Use Case thiếu kịch bản Exception (Dưới 3 kịch bản lỗi)  | NO-GO   | Trả BA|
| R-BA-02  | Tiêu chí Nghiệm thu (AC) mô tả cảm tính, thiếu số đo     | P1      | Trả BA|
| R-SA-01  | API ném Raw Database Entity, ép FE tự join/tính toán     | NO-GO   | Trả SA|
| R-SA-02  | Ghi dữ liệu đa bảng không sử dụng Database Transaction   | NO-GO   | Trả SA|
| R-SA-03  | Endpoint danh sách sử dụng OFFSET thay vì Cursor         | P1      | Trả SA|
| R-DEV-01 | Thiếu khối chú thích `@CODE-MEMORY` ở đầu file nguồn     | P1      | Trả Dev|
| R-DEV-02 | Ghi cứng text tiếng Việt không qua hàm dịch `t(...)`     | P0      | Trả Dev|
| R-DEV-03 | Component UI trùng lặp > 80% với component đã có         | NO-GO   | Trả Dev|
+---------------------------------------------------------------------------------------+
```

## 4.2 Biên bản Ký xác nhận Bàn giao (SA/BA Handoff Protocol)

Trước khi chuyển giao task cho Đội ngũ Lập trình (Dev) và Kiểm thử (QA), SA và BA bắt buộc phải điền đầy đủ checklist sau:

```markdown
## sa_ba_handoff_ack_v2
### Business Analyst (BA) Verification
- [x] Tài liệu SRS đã bao quát toàn bộ 10 Phân hệ chức năng và đánh mã UC/BR đầy đủ.
- [x] Mỗi Use Case có đủ Tiền điều kiện, Luồng chính, Luồng phụ và tối thiểu 3 Luồng Exception.
- [x] Bảng dữ liệu nghiệp vụ đã được thống nhất với Ban Chủ nhiệm CLB / Hiệp hội.

### Solution Architect (SA) Verification
- [x] Mô hình Cơ sở dữ liệu ERD và DDL Schema đã hỗ trợ đầy đủ các quan hệ và chỉ mục (Indexes).
- [x] 100% REST APIs được thiết kế chuẩn display-ready, có DTO validation và mã lỗi rõ ràng.
- [x] Mọi thao tác ghi đa bảng đều được cam kết thực thi trong Prisma `$transaction`.
- [x] Toàn bộ thiết kế kỹ thuật đều có mã tham chiếu `ref_srs` trỏ về Use Case của BA.
```

---

## 📌 PHÊ DUYỆT & KÝ TÊN BÀN GIAO

| Đại diện Nghiệp vụ & Kỹ thuật | Họ và Tên | Chữ ký & Ngày |
| :--- | :--- | :--- |
| **Senior Lead Business Analyst** | Ban Nghiệp vụ ViOne | *Đã ký xác nhận* — 08/09/2026 |
| **Chief Solution Architect** | Ban Kiến trúc Hệ thống | *Đã ký xác nhận* — 08/09/2026 |
| **Technical Lead** | Ban Kỹ thuật Dự án | *Đã phê duyệt bàn giao* — 08/09/2026 |