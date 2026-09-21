/**
 * Multi-Channel Fixed Template Engine for Vione Platform
 * 
 * Supports curated, immutable templates for:
 * 1. Room Booking Workflow (Request to Admin, Approved with Zoom/Meet/Offline room, Rejected with reason)
 * 2. Payment Flow (Invoice Pending with VietQR, Receipt Confirmation)
 * 3. Event Notification Flow (Announcement, Ticket with QR & Banquet Table, Payment Reminder)
 * 4. Cross-App Realtime Message Flow (2-way sync between Web CRM and Mobile Apps in the same Association)
 */

export type TemplateCategory = "room_booking" | "payment" | "event" | "cross_app";

export type TemplateChannel = "email" | "in_app" | "push" | "sms";

export interface TemplateVariable {
  key: string;
  label: string;
  example: string;
}

export interface NotificationTemplate {
  id: string;
  code: string;
  category: TemplateCategory;
  name: string;
  description: string;
  targetRole: "admin" | "requester" | "attendees" | "members" | "payer";
  channels: TemplateChannel[];
  subject: string;
  inAppTitle: string;
  inAppBody: string;
  htmlBody: string;
  variables: TemplateVariable[];
  isLocked: boolean; // Immutable enterprise standard
  updatedAt: string;
}

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  // ── 1. ROOM BOOKING WORKFLOW ─────────────────────────────────────────
  {
    id: "tmpl_room_booking_req",
    code: "MEETING_BOOKING_REQUEST",
    category: "room_booking",
    name: "Thông báo Yêu cầu Đặt phòng Họp (Gửi Ban Quản Trị)",
    description: "Tự động gửi đến Quản trị viên khi có hội viên / cán bộ ban đăng ký sử dụng phòng họp Online hoặc Offline.",
    targetRole: "admin",
    channels: ["email", "in_app", "push"],
    subject: "[YÊU CẦU DUYỆT PHÒNG HỌP] {{meetingTitle}} - {{requesterName}}",
    inAppTitle: "Yêu cầu đặt phòng họp mới từ {{requesterName}}",
    inAppBody: "{{requesterName}} vừa gửi yêu cầu book phòng '{{roomName}}' cho cuộc họp '{{meetingTitle}}' vào lúc {{startTime}} ngày {{date}}.",
    variables: [
      { key: "requesterName", label: "Tên người đặt", example: "Lê Hoàng Long" },
      { key: "requesterEmail", label: "Email người đặt", example: "long.le@ceo1983.com" },
      { key: "requesterPhone", label: "Số điện thoại", example: "0983 000 001" },
      { key: "meetingTitle", label: "Tiêu đề cuộc họp", example: "Họp Ban Xúc Tiến Thương Mại Quý 3" },
      { key: "roomName", label: "Tên phòng họp", example: "Phòng Họp VIP Sapphire (Tầng 5)" },
      { key: "meetingMode", label: "Hình thức", example: "Offline kết hợp Zoom trực tuyến" },
      { key: "date", label: "Ngày họp", example: "15/10/2026" },
      { key: "startTime", label: "Giờ bắt đầu", example: "14:30" },
      { key: "endTime", label: "Giờ kết thúc", example: "16:30" },
      { key: "attendeesCount", label: "Số lượng tham dự", example: "15 đại biểu" },
      { key: "approvalUrl", label: "Link duyệt nhanh", example: "https://vione.app/meetings?tab=bookings&id=BK-1983" },
    ],
    isLocked: true,
    updatedAt: "2026-09-12",
    htmlBody: `
<div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
  <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 32px 28px; text-align: left; color: #ffffff;">
    <div style="display: inline-block; padding: 4px 12px; background: rgba(234, 179, 8, 0.2); border: 1px solid rgba(234, 179, 8, 0.4); border-radius: 9999px; font-size: 12px; font-weight: 600; color: #fde047; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
      Yêu Cầu Chờ Phê Duyệt
    </div>
    <h1 style="margin: 0; font-size: 22px; font-weight: 700; line-height: 1.3; color: #ffffff;">Đăng Ký Sử Dụng Phòng Họp Mới</h1>
    <p style="margin: 8px 0 0; font-size: 14px; color: #94a3b8;">Hệ thống VIONE CRM - Thông báo phân quyền quản trị phòng họp</p>
  </div>
  <div style="padding: 28px; background: #ffffff;">
    <p style="margin: 0 0 16px; font-size: 15px; color: #334155; line-height: 1.6;">
      Kính gửi <strong>Ban Quản trị Hiệp hội</strong>,
    </p>
    <p style="margin: 0 0 20px; font-size: 14px; color: #475569; line-height: 1.6;">
      Hệ thống vừa tiếp nhận yêu cầu đăng ký mượn phòng họp từ thành viên. Thông tin chi tiết như sau:
    </p>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; width: 140px;">Cuộc họp:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">{{meetingTitle}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Người đăng ký:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 500;">{{requesterName}} ({{requesterEmail}} - {{requesterPhone}})</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Phòng họp:</td>
          <td style="padding: 6px 0; color: #2563eb; font-weight: 600;">{{roomName}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Hình thức:</td>
          <td style="padding: 6px 0; color: #0f172a;">{{meetingMode}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Thời gian:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">{{startTime}} - {{endTime}}, Ngày {{date}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Quy mô:</td>
          <td style="padding: 6px 0; color: #0f172a;">{{attendeesCount}}</td>
        </tr>
      </table>
    </div>
    <div style="text-align: center; margin: 30px 0 16px;">
      <a href="{{approvalUrl}}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 32px; font-size: 14px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 12px rgba(37,99,235,0.25);">
        Xem Lịch & Phê Duyệt Ngay
      </a>
    </div>
    <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
      Sau khi Quản trị viên duyệt, hệ thống sẽ tự động gửi email xác nhận kèm phòng họp và link trực tuyến về cho người đặt.
    </p>
  </div>
</div>
`,
  },
  {
    id: "tmpl_room_booking_approved",
    code: "MEETING_BOOKING_CONFIRMED",
    category: "room_booking",
    name: "Xác nhận Phê Duyệt Phòng Họp (Gửi Người Đăng Ký & Thành Viên)",
    description: "Gửi thông báo và email xác nhận khi Quản trị viên đã phê duyệt yêu cầu đặt phòng (kèm link Online hoặc phòng Offline).",
    targetRole: "requester",
    channels: ["email", "in_app", "push"],
    subject: "[XÁC NHẬN ĐÃ DUYỆT] Phòng Họp: {{meetingTitle}} - {{roomName}}",
    inAppTitle: "Phòng họp '{{meetingTitle}}' đã được Ban Quản Trị phê duyệt!",
    inAppBody: "Chúc mừng bạn! Yêu cầu sử dụng phòng '{{roomName}}' ngày {{date}} ({{startTime}} - {{endTime}}) đã được duyệt. Xem link họp và chỉ dẫn sử dụng tại đây.",
    variables: [
      { key: "requesterName", label: "Tên người đặt", example: "Lê Hoàng Long" },
      { key: "meetingTitle", label: "Tiêu đề cuộc họp", example: "Họp Ban Xúc Tiến Thương Mại Quý 3" },
      { key: "roomName", label: "Tên phòng", example: "Phòng Họp VIP Sapphire (Tầng 5)" },
      { key: "locationAddress", label: "Địa chỉ phòng offline", example: "Văn phòng Hiệp hội CEO 1983, Tầng 5 Tòa nhà V-Tower, Hà Nội" },
      { key: "onlineMeetingUrl", label: "Link họp Online (Zoom/Meet)", example: "https://zoom.us/j/88819839999?pwd=CEO" },
      { key: "passcode", label: "Mật khẩu phòng", example: "198388" },
      { key: "date", label: "Ngày họp", example: "15/10/2026" },
      { key: "startTime", label: "Bắt đầu", example: "14:30" },
      { key: "endTime", label: "Kết thúc", example: "16:30" },
      { key: "adminNotes", label: "Ghi chú từ Ban Quản Trị", example: "Đã bật sẵn màn hình LED và mic Polycom cho đoàn." },
    ],
    isLocked: true,
    updatedAt: "2026-09-12",
    htmlBody: `
<div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
  <div style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 32px 28px; text-align: left; color: #ffffff;">
    <div style="display: inline-block; padding: 4px 12px; background: rgba(255, 255, 255, 0.2); border-radius: 9999px; font-size: 12px; font-weight: 600; color: #a7f3d0; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
      Đã Phê Duyệt Thành Công
    </div>
    <h1 style="margin: 0; font-size: 22px; font-weight: 700; line-height: 1.3; color: #ffffff;">Xác Nhận Đặt Phòng Họp Thành Công</h1>
    <p style="margin: 8px 0 0; font-size: 14px; color: #d1fae5;">Quản trị viên đã chấp thuận lịch sử dụng phòng họp của bạn</p>
  </div>
  <div style="padding: 28px; background: #ffffff;">
    <p style="margin: 0 0 16px; font-size: 15px; color: #334155; line-height: 1.6;">
      Xin chào <strong>{{requesterName}}</strong>,
    </p>
    <p style="margin: 0 0 20px; font-size: 14px; color: #475569; line-height: 1.6;">
      Yêu cầu book phòng họp của bạn cho cuộc họp <strong>{{meetingTitle}}</strong> đã được phê duyệt chính thức. Bạn đã có quyền sử dụng phòng họp theo thông tin dưới đây:
    </p>
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #166534; width: 140px; font-weight: 600;">Cuộc họp:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">{{meetingTitle}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #166534; font-weight: 600;">Phòng họp:</td>
          <td style="padding: 6px 0; color: #047857; font-weight: 700;">{{roomName}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #166534; font-weight: 600;">Thời gian:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">{{startTime}} - {{endTime}} | Ngày {{date}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #166534; font-weight: 600;">Địa điểm Offline:</td>
          <td style="padding: 6px 0; color: #334155;">{{locationAddress}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #166534; font-weight: 600;">Link Trực Tuyến:</td>
          <td style="padding: 6px 0;"><a href="{{onlineMeetingUrl}}" style="color: #2563eb; font-weight: 600;">{{onlineMeetingUrl}}</a></td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #166534; font-weight: 600;">Passcode họp:</td>
          <td style="padding: 6px 0; color: #dc2626; font-weight: 700;">{{passcode}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #166534; font-weight: 600;">Ghi chú Admin:</td>
          <td style="padding: 6px 0; color: #475569; font-style: italic;">{{adminNotes}}</td>
        </tr>
      </table>
    </div>
    <div style="text-align: center; margin: 28px 0;">
      <a href="{{onlineMeetingUrl}}" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; padding: 12px 32px; font-size: 14px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 12px rgba(5,150,105,0.25);">
        Vào Phòng Họp Ngay
      </a>
    </div>
    <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
      * Vui lòng có mặt hoặc kết nối trực tuyến trước 10 phút để kiểm tra kỹ thuật âm thanh & trình chiếu.
    </p>
  </div>
</div>
`,
  },
  {
    id: "tmpl_room_booking_declined",
    code: "MEETING_BOOKING_REJECTED",
    category: "room_booking",
    name: "Thông Báo Từ Chối Đặt Phòng (Gửi Người Đăng Ký)",
    description: "Gửi thông báo giải thích lý do khi Quản trị viên không thể duyệt phòng họp và hướng dẫn chọn giờ thay thế.",
    targetRole: "requester",
    channels: ["email", "in_app"],
    subject: "[THÔNG BÁO] Yêu cầu phòng họp '{{meetingTitle}}' chưa được phê duyệt",
    inAppTitle: "Yêu cầu phòng họp '{{meetingTitle}}' bị từ chối",
    inAppBody: "Rất tiếc, phòng họp '{{roomName}}' vào {{startTime}} ngày {{date}} chưa thể duyệt vì: {{rejectionReason}}.",
    variables: [
      { key: "requesterName", label: "Tên người đặt", example: "Lê Hoàng Long" },
      { key: "meetingTitle", label: "Tiêu đề cuộc họp", example: "Họp Ban Xúc Tiến Thương Mại Quý 3" },
      { key: "roomName", label: "Tên phòng", example: "Phòng Họp VIP Sapphire" },
      { key: "rejectionReason", label: "Lý do từ chối", example: "Trùng lịch họp đột xuất của Hội Đồng Cố Vấn Ban Chấp Hành." },
      { key: "suggestedAlternative", label: "Gợi ý thay thế", example: "Phòng Hội Thảo Tầng 3 còn trống lúc 16:30 cùng ngày." },
      { key: "rebookUrl", label: "Link đặt lại", example: "https://vione.app/meetings?tab=book" },
    ],
    isLocked: true,
    updatedAt: "2026-09-12",
    htmlBody: `
<div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
  <div style="background: #991b1b; padding: 28px; text-align: left; color: #ffffff;">
    <h1 style="margin: 0; font-size: 20px; font-weight: 700;">Thông Báo Về Yêu Cầu Đặt Phòng Họp</h1>
    <p style="margin: 6px 0 0; font-size: 13px; color: #fecaca;">Yêu cầu chưa thể phê duyệt do xung đột lịch hoặc điều kiện phòng</p>
  </div>
  <div style="padding: 28px;">
    <p style="margin: 0 0 16px; font-size: 14px; color: #334155;">
      Kính gửi <strong>{{requesterName}}</strong>,
    </p>
    <p style="margin: 0 0 16px; font-size: 14px; color: #475569; line-height: 1.6;">
      Ban Quản Trị rất tiếc phải thông báo rằng yêu cầu book phòng <strong>{{roomName}}</strong> cho cuộc họp <em>{{meetingTitle}}</em> chưa thể phê duyệt vào thời điểm này.
    </p>
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #991b1b;">Lý do từ chối:</p>
      <p style="margin: 0 0 12px; font-size: 14px; color: #7f1d1d;">{{rejectionReason}}</p>
      <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #1e3a8a;">Phương án đề xuất:</p>
      <p style="margin: 0; font-size: 14px; color: #1e40af;">{{suggestedAlternative}}</p>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="{{rebookUrl}}" style="display: inline-block; background: #334155; color: #ffffff; text-decoration: none; padding: 10px 24px; font-size: 14px; font-weight: 600; border-radius: 8px;">
        Chọn Khung Giờ Hoặc Phòng Khác
      </a>
    </div>
  </div>
</div>
`,
  },

  // ── 2. PAYMENT WORKFLOW ──────────────────────────────────────────────
  {
    id: "tmpl_payment_invoice_pending",
    code: "PAYMENT_INVOICE_PENDING",
    category: "payment",
    name: "Lệnh Thanh Toán & Mã QR Chuyển Khoản VietQR",
    description: "Gửi thông báo thanh toán (phí hội viên, vé sự kiện, gói tài trợ) kèm mã QR chuẩn VietQR tự động điền số tiền và nội dung.",
    targetRole: "payer",
    channels: ["email", "in_app", "push"],
    subject: "[LỆNH THANH TOÁN] {{serviceName}} - Số tiền: {{amountFormatted}}",
    inAppTitle: "Lệnh thanh toán: {{serviceName}}",
    inAppBody: "Quý hội viên có lệnh thanh toán {{amountFormatted}} cho '{{serviceName}}'. Quét VietQR hoặc chuyển khoản trước {{deadline}}.",
    variables: [
      { key: "payerName", label: "Tên người nộp", example: "Vũ Thu Trang" },
      { key: "serviceName", label: "Dịch vụ / Hạng mục", example: "Vé VIP Gala Dinner Doanh Nhân 1983" },
      { key: "amountFormatted", label: "Số tiền", example: "2.500.000 VNĐ" },
      { key: "invoiceCode", label: "Mã hoá đơn", example: "INV-2026-8891" },
      { key: "bankName", label: "Ngân hàng thụ hưởng", example: "Ngân hàng TMCP Quân Đội (MB Bank)" },
      { key: "accountNumber", label: "Số tài khoản", example: "198388889999" },
      { key: "accountHolder", label: "Chủ tài khoản", example: "CLB DOANH NHAN CEO 1983" },
      { key: "transferContent", label: "Nội dung chuyển khoản", example: "INV8891 VU THU TRANG" },
      { key: "qrCodeUrl", label: "Link ảnh VietQR", example: "https://img.vietqr.io/image/MB-198388889999-compact2.png?amount=2500000&addInfo=INV8891%20VU%20THU%20TRANG" },
      { key: "deadline", label: "Hạn chót thanh toán", example: "18:00 ngày 14/10/2026" },
    ],
    isLocked: true,
    updatedAt: "2026-09-12",
    htmlBody: `
<div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
  <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 32px 28px; text-align: left; color: #ffffff;">
    <div style="display: inline-block; padding: 4px 12px; background: rgba(255, 255, 255, 0.2); border-radius: 9999px; font-size: 12px; font-weight: 600; color: #dbeafe; margin-bottom: 12px; text-transform: uppercase;">
      Hóa Đơn Điện Tử / Phiếu Thu
    </div>
    <h1 style="margin: 0; font-size: 22px; font-weight: 700;">Thông Báo Thanh Toán: {{serviceName}}</h1>
    <p style="margin: 8px 0 0; font-size: 14px; color: #bfdbfe;">Mã chứng từ: {{invoiceCode}}</p>
  </div>
  <div style="padding: 28px;">
    <p style="margin: 0 0 16px; font-size: 15px; color: #334155;">
      Kính gửi <strong>{{payerName}}</strong>,
    </p>
    <p style="margin: 0 0 20px; font-size: 14px; color: #475569; line-height: 1.6;">
      Hệ thống xin gửi đến Quý hội viên thông tin thanh toán cho hạng mục <strong>{{serviceName}}</strong>:
    </p>
    <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 6px; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 600;">Tổng Số Tiền Cần Thanh Toán</p>
      <div style="font-size: 32px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px;">{{amountFormatted}}</div>
      <p style="margin: 6px 0 0; font-size: 12px; color: #dc2626; font-weight: 500;">Hạn thanh toán trước: {{deadline}}</p>
    </div>
    <div style="display: flex; gap: 24px; align-items: center; background: #ffffff; border: 1px dashed #94a3b8; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <div style="text-align: center; flex-shrink: 0;">
        <img src="{{qrCodeUrl}}" alt="VietQR Thanh Toán" style="width: 150px; height: 150px; border-radius: 8px; border: 1px solid #e2e8f0;" />
        <p style="margin: 6px 0 0; font-size: 11px; color: #64748b;">Quét app Ngân hàng</p>
      </div>
      <div style="font-size: 13px; color: #334155; line-height: 1.7;">
        <div><strong>Ngân hàng:</strong> {{bankName}}</div>
        <div><strong>Số tài khoản:</strong> <span style="font-family: monospace; font-size: 15px; font-weight: 700; color: #0f172a;">{{accountNumber}}</span></div>
        <div><strong>Chủ tài khoản:</strong> {{accountHolder}}</div>
        <div><strong>Nội dung CK:</strong> <span style="background: #fef08a; padding: 2px 6px; font-weight: 700; border-radius: 4px; font-family: monospace;">{{transferContent}}</span></div>
      </div>
    </div>
    <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
      Hệ thống sẽ tự động gạch nợ và xuất biên lai xác nhận ngay khi tài khoản nhận được biến động số dư.
    </p>
  </div>
</div>
`,
  },
  {
    id: "tmpl_payment_receipt_success",
    code: "PAYMENT_RECEIPT_SUCCESS",
    category: "payment",
    name: "Biên Nhận Xác Nhận Thanh Toán Thành Công",
    description: "Gửi biên nhận điện tử xác nhận đã thu tiền thành công kèm mã giao dịch và quyền lợi hội viên.",
    targetRole: "payer",
    channels: ["email", "in_app"],
    subject: "[BIÊN NHẬN ĐIỆN TỬ] Xác nhận thanh toán thành công - {{serviceName}}",
    inAppTitle: "Thanh toán thành công: {{serviceName}}",
    inAppBody: "Hệ thống đã nhận {{amountFormatted}} cho giao dịch {{transactionCode}}. Cảm ơn Quý hội viên!",
    variables: [
      { key: "payerName", label: "Tên người nộp", example: "Vũ Thu Trang" },
      { key: "serviceName", label: "Dịch vụ", example: "Vé VIP Gala Dinner Doanh Nhân 1983" },
      { key: "amountFormatted", label: "Số tiền đã nộp", example: "2.500.000 VNĐ" },
      { key: "transactionCode", label: "Mã giao dịch", example: "TXN-2026-99120" },
      { key: "paidAt", label: "Thời gian thanh toán", example: "10:15 ngày 12/09/2026" },
      { key: "receiptDownloadUrl", label: "Link tải biên lai PDF", example: "https://vione.app/finance/receipt?id=TXN-99120" },
    ],
    isLocked: true,
    updatedAt: "2026-09-12",
    htmlBody: `
<div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
  <div style="background: #047857; padding: 28px; text-align: left; color: #ffffff;">
    <h1 style="margin: 0; font-size: 20px; font-weight: 700;">Biên Nhận Thanh Toán Điện Tử</h1>
    <p style="margin: 6px 0 0; font-size: 13px; color: #a7f3d0;">Giao dịch đã được đối soát và ghi nhận thành công</p>
  </div>
  <div style="padding: 28px;">
    <p style="margin: 0 0 16px; font-size: 14px; color: #334155;">Kính gửi <strong>{{payerName}}</strong>,</p>
    <p style="margin: 0 0 20px; font-size: 14px; color: #475569; line-height: 1.6;">
      Ban Tài Chính Hiệp hội xin trân trọng xác nhận đã nhận đủ khoản thanh toán của Quý vị.
    </p>
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <table style="width: 100%; font-size: 14px;">
        <tr><td style="color: #166534; padding: 4px 0;">Mục thanh toán:</td><td style="font-weight: 600;">{{serviceName}}</td></tr>
        <tr><td style="color: #166534; padding: 4px 0;">Số tiền:</td><td style="font-weight: 700; color: #047857;">{{amountFormatted}}</td></tr>
        <tr><td style="color: #166534; padding: 4px 0;">Mã giao dịch:</td><td style="font-family: monospace;">{{transactionCode}}</td></tr>
        <tr><td style="color: #166534; padding: 4px 0;">Thời gian ghi nhận:</td><td>{{paidAt}}</td></tr>
      </table>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="{{receiptDownloadUrl}}" style="display: inline-block; background: #047857; color: #ffffff; text-decoration: none; padding: 10px 24px; font-size: 14px; font-weight: 600; border-radius: 8px;">
        Tải Biên Nhận Điện Tử (PDF)
      </a>
    </div>
  </div>
</div>
`,
  },

  // ── 3. EVENT NOTIFICATION & TICKETING WORKFLOW ───────────────────────
  {
    id: "tmpl_event_announcement",
    code: "EVENT_ANNOUNCEMENT",
    category: "event",
    name: "Thông Báo Khởi Động Sự Kiện Mới Trong Hiệp Hội",
    description: "Gửi thư mời và công bố sự kiện mới tới toàn thể hội viên và khách mời tiềm năng.",
    targetRole: "members",
    channels: ["email", "in_app", "push"],
    subject: "[THƯ MỜI SỰ KIỆN] {{eventName}} - {{eventDate}}",
    inAppTitle: "Sự kiện mới: {{eventName}}",
    inAppBody: "Hiệp hội trân trọng kính mời Quý Doanh nhân tham dự '{{eventName}}' vào ngày {{eventDate}} tại {{eventLocation}}.",
    variables: [
      { key: "memberName", label: "Tên hội viên", example: "Đỗ Thị Mai" },
      { key: "eventName", label: "Tên sự kiện", example: "Diễn Đàn Chuyển Đổi Số & Kết Nối Giao Thương 2026" },
      { key: "eventDate", label: "Ngày diễn ra", example: "20/11/2026" },
      { key: "eventLocation", label: "Địa điểm", example: "Trung tâm Hội nghị Quốc Gia, Hà Nội" },
      { key: "keySpeakers", label: "Diễn giả tiêu biểu", example: "Chủ tịch Hiệp hội, TS. Kinh tế học Đỗ Văn Nam" },
      { key: "registrationUrl", label: "Link đăng ký", example: "https://vione.app/events/evt-2026" },
    ],
    isLocked: true,
    updatedAt: "2026-09-12",
    htmlBody: `
<div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 36px 28px; text-align: center; color: #ffffff;">
    <div style="display: inline-block; padding: 4px 12px; background: rgba(255, 255, 255, 0.2); border-radius: 9999px; font-size: 12px; font-weight: 600; color: #ede9fe; margin-bottom: 12px; text-transform: uppercase;">
      Thư Mời Doanh Nhân
    </div>
    <h1 style="margin: 0; font-size: 24px; font-weight: 800; line-height: 1.3;">{{eventName}}</h1>
    <p style="margin: 10px 0 0; font-size: 15px; color: #ddd6fe;">Thời gian: {{eventDate}} | {{eventLocation}}</p>
  </div>
  <div style="padding: 28px;">
    <p style="margin: 0 0 16px; font-size: 15px; color: #334155;">Kính gửi Anh/Chị <strong>{{memberName}}</strong>,</p>
    <p style="margin: 0 0 20px; font-size: 14px; color: #475569; line-height: 1.6;">
      Ban Chấp Hành Hiệp hội trân trọng kính mời Quý Anh/Chị tham dự chương trình đặc biệt quy tụ hơn 500 Chủ doanh nghiệp và Lãnh đạo cấp cao.
    </p>
    <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <div style="margin-bottom: 10px;"><strong>Diễn giả:</strong> {{keySpeakers}}</div>
      <div><strong>Địa điểm:</strong> {{eventLocation}}</div>
    </div>
    <div style="text-align: center; margin: 28px 0;">
      <a href="{{registrationUrl}}" style="display: inline-block; background: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 32px; font-size: 14px; font-weight: 600; border-radius: 8px;">
        Đăng Ký Tham Gia Ngay (Google Form)
      </a>
    </div>
  </div>
</div>
`,
  },
  {
    id: "tmpl_event_ticket_confirmation",
    code: "EVENT_TICKET_CONFIRMATION",
    category: "event",
    name: "Vé Mời Điện Tử & Mã QR Check-in (Kèm Số Bàn Tiệc Gala)",
    description: "Tự động gửi vé mời có mã QR, vị trí ghế ngồi hoặc số bàn tiệc Gala ngay sau khi người dùng điền Form đăng ký.",
    targetRole: "attendees",
    channels: ["email", "in_app", "push"],
    subject: "[VÉ MỜI ĐIỆN TỬ] {{eventName}} - Mã vé: {{ticketCode}}",
    inAppTitle: "Vé mời sự kiện '{{eventName}}' của bạn đã sẵn sàng!",
    inAppBody: "Mã vé {{ticketCode}} | Vị trí: {{seatOrTable}} | Quý khách vui lòng xuất trình mã QR tại cửa Check-in.",
    variables: [
      { key: "attendeeName", label: "Tên đại biểu", example: "Phạm Quang Huy" },
      { key: "eventName", label: "Tên sự kiện", example: "Gala Dinner & Business Networking 2026" },
      { key: "ticketCode", label: "Mã vé", example: "TKT-8839-GL" },
      { key: "seatOrTable", label: "Vị trí bàn tiệc / ghế", example: "Bàn Tiệc VIP 02 (Bàn Tròn 10 Chỗ)" },
      { key: "ticketType", label: "Hạng vé", example: "Vé Đại Biểu VIP" },
      { key: "eventTime", label: "Thời gian", example: "17:30 - 21:30 ngày 25/11/2026" },
      { key: "eventAddress", label: "Địa chỉ", example: "Khách sạn Grand Plaza, 117 Trần Duy Hưng, Hà Nội" },
      { key: "qrCodeDataUrl", label: "Mã QR Check-in", example: "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=VIONE-TKT-8839-GL" },
    ],
    isLocked: true,
    updatedAt: "2026-09-12",
    htmlBody: `
<div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
  <div style="background: linear-gradient(135deg, #111827 0%, #1f2937 100%); padding: 32px 28px; text-align: left; color: #ffffff; border-bottom: 2px solid #eab308;">
    <div style="display: inline-block; padding: 4px 12px; background: rgba(234, 179, 8, 0.2); border: 1px solid #eab308; border-radius: 9999px; font-size: 11px; font-weight: 700; color: #facc15; margin-bottom: 12px; text-transform: uppercase;">
      Official E-Ticket & Pass
    </div>
    <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff;">{{eventName}}</h1>
    <p style="margin: 8px 0 0; font-size: 13px; color: #9ca3af;">Vé mời tham dự chính thức - Hiệp hội Doanh nhân</p>
  </div>
  <div style="padding: 28px;">
    <div style="background: #fafaf9; border: 2px dashed #d6d3d1; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 8px; font-size: 13px; color: #78716c; text-transform: uppercase; font-weight: 600;">Mã QR Check-in Đại Biểu</p>
      <img src="{{qrCodeDataUrl}}" alt="QR Code" style="width: 170px; height: 170px; margin: 8px auto; display: block; border: 4px solid #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.08);" />
      <div style="font-size: 20px; font-weight: 800; font-family: monospace; color: #0c0a09; margin-top: 10px;">{{ticketCode}}</div>
      <p style="margin: 4px 0 0; font-size: 12px; color: #78716c;">Vui lòng xuất trình mã này tại quầy đón tiếp</p>
    </div>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
      <table style="width: 100%; font-size: 14px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 140px;">Đại biểu:</td><td style="font-weight: 700; color: #0f172a;">{{attendeeName}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Hạng vé:</td><td style="font-weight: 600; color: #b45309;">{{ticketType}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Vị trí Bàn tiệc / Ghế:</td><td style="font-weight: 700; color: #047857; font-size: 15px;">{{seatOrTable}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Thời gian đón tiếp:</td><td style="font-weight: 600; color: #0f172a;">{{eventTime}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Địa điểm:</td><td style="color: #334155;">{{eventAddress}}</td></tr>
      </table>
    </div>
  </div>
</div>
`,
  },

  // ── 4. CROSS-APP REALTIME MESSAGING WORKFLOW ─────────────────────────
  {
    id: "tmpl_cross_app_message",
    code: "CROSS_APP_COMMUNITY_MESSAGE",
    category: "cross_app",
    name: "Thông Điệp Đồng Bộ 2 Chiều Giữa 2 App Vione Trong Cùng Hiệp Hội",
    description: "Đảm bảo luồng dữ liệu 2 chiều (luồng đi có luồng về) giữa Web CRM Admin và 2 ứng dụng Vione Mobile của cùng một Hiệp hội.",
    targetRole: "members",
    channels: ["in_app", "push"],
    subject: "[VIONE CONNECT] Tin nhắn mới từ {{senderName}} ({{associationName}})",
    inAppTitle: "Tin nhắn từ {{senderName}} - {{associationName}}",
    inAppBody: "{{messageSnippet}}",
    variables: [
      { key: "senderName", label: "Người gửi", example: "Ban Thư Ký Hiệp Hội" },
      { key: "receiverName", label: "Người nhận", example: "Hoàng Minh Tuấn" },
      { key: "associationName", label: "Tên Hiệp hội", example: "CLB Doanh Nhân CEO 1983" },
      { key: "messageSnippet", label: "Nội dung tóm tắt", example: "Kính gửi anh Tuấn, Ban Xúc Tiến Thương Mại đã xác nhận hồ sơ kết nối B2B với tập đoàn An Phát." },
      { key: "threadUrl", label: "Link mở hội thoại", example: "vione://chat/thread/TH-1983-09" },
    ],
    isLocked: true,
    updatedAt: "2026-09-12",
    htmlBody: `
<div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 24px;">
  <div style="font-size: 12px; font-weight: 700; color: #2563eb; text-transform: uppercase; margin-bottom: 8px;">{{associationName}} - VIONE Connect</div>
  <h2 style="margin: 0 0 12px; font-size: 18px; color: #0f172a;">Thông Báo Từ {{senderName}}</h2>
  <div style="background: #f1f5f9; border-radius: 10px; padding: 16px; font-size: 14px; color: #334155; line-height: 1.6; margin-bottom: 16px;">
    {{messageSnippet}}
  </div>
  <a href="{{threadUrl}}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 20px; font-size: 13px; font-weight: 600; border-radius: 6px;">
    Phản Hồi Trực Tiếp Trên App
  </a>
</div>
`,
  },
];

/**
 * Render template string with variable dictionary
 */
export function renderTemplateString(rawText: string, data: Record<string, string>): string {
  let output = rawText;
  for (const [key, value] of Object.entries(data)) {
    const reg = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    output = output.replace(reg, value || "");
  }
  return output;
}

/**
 * Render complete template payload
 */
export function renderNotificationTemplate(
  template: NotificationTemplate,
  data: Record<string, string>,
): {
  subject: string;
  inAppTitle: string;
  inAppBody: string;
  htmlBody: string;
} {
  return {
    subject: renderTemplateString(template.subject, data),
    inAppTitle: renderTemplateString(template.inAppTitle, data),
    inAppBody: renderTemplateString(template.inAppBody, data),
    htmlBody: renderTemplateString(template.htmlBody, data),
  };
}
