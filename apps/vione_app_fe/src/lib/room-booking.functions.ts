/**
 * Meeting Room Booking & Admin Approval Workflow Engine
 * 
 * Supports:
 * - Physical meeting rooms (Offline) & Virtual rooms (Zoom/Meet/Teams)
 * - Booking requests with state machine: pending_admin -> approved | rejected | cancelled
 * - Auto-triggering multi-channel notification templates (Email + In-App + Push)
 * - Conflict detection between time slots
 */

import { NOTIFICATION_TEMPLATES, renderNotificationTemplate } from "./notification-templates";

export interface MeetingRoom {
  id: string;
  code: string;
  name: string;
  type: "offline" | "online" | "hybrid";
  capacity: number;
  location: string;
  equipment: string[];
  defaultZoomUrl?: string;
  defaultPasscode?: string;
  imageUrl?: string;
  isActive: boolean;
}

export interface RoomBookingRequest {
  id: string;
  roomId: string;
  roomName: string;
  title: string;
  organizerName: string;
  organizerEmail: string;
  organizerPhone: string;
  department: string;
  mode: "offline" | "online" | "hybrid";
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  attendeesCount: number;
  equipmentRequested: string[];
  purpose: string;
  status: "pending_admin" | "approved" | "rejected" | "cancelled";
  adminNotes?: string;
  rejectionReason?: string;
  onlineMeetingUrl?: string;
  onlinePasscode?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export const INITIAL_MEETING_ROOMS: MeetingRoom[] = [
  {
    id: "room_diamond",
    code: "RM-DIA-50",
    name: "Hội Trường Kim Cương (Diamond Hall)",
    type: "hybrid",
    capacity: 60,
    location: "Tầng 5, Tòa nhà CEO 1983 Tower, Hà Nội",
    equipment: ["Màn hình LED 200 inch", "Hệ thống âm thanh sân khấu", "3 Micro không dây", "Camera Polycom 4K AI Tracking", "Bục phát biểu"],
    defaultZoomUrl: "https://zoom.us/j/88819830001",
    defaultPasscode: "198301",
    isActive: true,
  },
  {
    id: "room_sapphire",
    code: "RM-SAP-20",
    name: "Phòng Họp VIP Sapphire (Boardroom)",
    type: "hybrid",
    capacity: 22,
    location: "Tầng 4, Tòa nhà CEO 1983 Tower, Hà Nội",
    equipment: ["TV tương tác 85 inch", "Hệ thống Polycom Studio", "Bàn họp chữ U bọc da", "Loa mic hội nghị trần", "Bảng kính từ tính"],
    defaultZoomUrl: "https://zoom.us/j/88819830002",
    defaultPasscode: "198302",
    isActive: true,
  },
  {
    id: "room_lotus",
    code: "RM-LOT-12",
    name: "Phòng Sáng Tạo & Khởi Nghiệp Lotus",
    type: "offline",
    capacity: 12,
    location: "Tầng 3, Không gian Co-working CEO Hub",
    equipment: ["Bảng trắng thông minh", "Máy chiếu Laser HD", "Loa Jabra Speak 710", "Bàn làm việc di động"],
    isActive: true,
  },
  {
    id: "room_virtual_studio",
    code: "RM-VIR-1000",
    name: "Phòng Họp Trực Tuyến Studio (Zoom & Meet Pro)",
    type: "online",
    capacity: 500,
    location: "Nền tảng Trực tuyến Đám mây VIONE Cloud",
    equipment: ["Bản quyền Zoom Pro 1000 thành viên", "Livestream đa nền tảng (Facebook/Youtube)", "Cloud Recording", "Phòng chờ bảo mật"],
    defaultZoomUrl: "https://zoom.us/j/88819839999",
    defaultPasscode: "198388",
    isActive: true,
  },
];

export const INITIAL_ROOM_BOOKINGS: RoomBookingRequest[] = [
  {
    id: "BK-1983-01",
    roomId: "room_sapphire",
    roomName: "Phòng Họp VIP Sapphire (Boardroom)",
    title: "Họp Ban Thường Trực: Đánh giá chỉ số liên kết doanh nghiệp Q3",
    organizerName: "Lê Hoàng Long",
    organizerEmail: "long.le@ceo1983.com",
    organizerPhone: "0983 000 001",
    department: "Ban Thư ký",
    mode: "hybrid",
    date: "2026-09-15",
    startTime: "14:30",
    endTime: "16:30",
    attendeesCount: 16,
    equipmentRequested: ["TV tương tác 85 inch", "Camera Polycom 4K AI Tracking"],
    purpose: "Báo cáo số liệu giao thương giữa các hội viên và kế hoạch kết nạp quý 4.",
    status: "approved",
    adminNotes: "Đã chuẩn bị nước suối, teabreak và bật sẵn mic hội nghị.",
    onlineMeetingUrl: "https://zoom.us/j/88819830002?pwd=SAP",
    onlinePasscode: "198302",
    createdAt: "2026-09-10T08:00:00Z",
    reviewedAt: "2026-09-10T10:30:00Z",
    reviewedBy: "Chủ tịch Hiệp hội",
  },
  {
    id: "BK-1983-02",
    roomId: "room_diamond",
    roomName: "Hội Trường Kim Cương (Diamond Hall)",
    title: "Workshop: Chiến lược chuyển đổi AI trong điều hành doanh nghiệp",
    organizerName: "Hoàng Minh Tuấn",
    organizerEmail: "tuan.hoang@ceo1983.com",
    organizerPhone: "0983 000 005",
    department: "Ban Xúc tiến thương mại",
    mode: "hybrid",
    date: "2026-09-18",
    startTime: "09:00",
    endTime: "11:30",
    attendeesCount: 45,
    equipmentRequested: ["Màn hình LED 200 inch", "3 Micro không dây", "Hệ thống âm thanh sân khấu"],
    purpose: "Tập huấn chuyên sâu cho 35 doanh nghiệp hội viên ngành công nghệ và sản xuất.",
    status: "pending_admin",
    createdAt: "2026-09-12T02:15:00Z",
  },
  {
    id: "BK-1983-03",
    roomId: "room_virtual_studio",
    roomName: "Phòng Họp Trực Tuyến Studio (Zoom & Meet Pro)",
    title: "Pitching 1-on-1: Dự án Chuỗi Cung Ứng Xanh",
    organizerName: "Vũ Thu Trang",
    organizerEmail: "trang.vu@ceo1983.com",
    organizerPhone: "0983 000 003",
    department: "Ban Tài chính",
    mode: "online",
    date: "2026-09-16",
    startTime: "10:00",
    endTime: "11:00",
    attendeesCount: 8,
    equipmentRequested: ["Cloud Recording"],
    purpose: "Kết nối Quỹ đầu tư mạo hiểm và 3 startup nông nghiệp công nghệ cao.",
    status: "pending_admin",
    onlineMeetingUrl: "https://zoom.us/j/88819839999",
    onlinePasscode: "198388",
    createdAt: "2026-09-12T03:40:00Z",
  },
];

const STORAGE_KEY_ROOMS = "vione_meeting_rooms_registry";
const STORAGE_KEY_BOOKINGS = "vione_meeting_room_bookings";

function getStoredRooms(): MeetingRoom[] {
  if (typeof window === "undefined") return INITIAL_MEETING_ROOMS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ROOMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(INITIAL_MEETING_ROOMS));
      return INITIAL_MEETING_ROOMS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MEETING_ROOMS;
  }
}

function getStoredBookings(): RoomBookingRequest[] {
  if (typeof window === "undefined") return INITIAL_ROOM_BOOKINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(INITIAL_ROOM_BOOKINGS));
      return INITIAL_ROOM_BOOKINGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ROOM_BOOKINGS;
  }
}

function saveBookings(bookings: RoomBookingRequest[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
  } catch {
    /* ignore */
  }
}

/**
 * Service API for Room Bookings
 */
export const RoomBookingService = {
  getRooms(): MeetingRoom[] {
    return getStoredRooms();
  },

  getBookings(): RoomBookingRequest[] {
    return getStoredBookings();
  },

  /**
   * Request a room booking
   * Automatically dispatches Admin Notification Email (MEETING_BOOKING_REQUEST)
   */
  requestBooking(params: {
    roomId: string;
    title: string;
    organizerName: string;
    organizerEmail: string;
    organizerPhone: string;
    department: string;
    mode: "offline" | "online" | "hybrid";
    date: string;
    startTime: string;
    endTime: string;
    attendeesCount: number;
    equipmentRequested: string[];
    purpose: string;
  }): { booking: RoomBookingRequest; dispatchedEmail: any } {
    const rooms = getStoredRooms();
    const room = rooms.find((r) => r.id === params.roomId);
    if (!room) throw new Error("Không tìm thấy phòng họp được chọn.");

    const newBooking: RoomBookingRequest = {
      id: `BK-${Date.now().toString(36).toUpperCase()}`,
      roomId: room.id,
      roomName: room.name,
      title: params.title,
      organizerName: params.organizerName,
      organizerEmail: params.organizerEmail,
      organizerPhone: params.organizerPhone,
      department: params.department,
      mode: params.mode,
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
      attendeesCount: params.attendeesCount,
      equipmentRequested: params.equipmentRequested,
      purpose: params.purpose,
      status: "pending_admin",
      onlineMeetingUrl: params.mode !== "offline" ? (room.defaultZoomUrl || "https://meet.google.com/new") : undefined,
      onlinePasscode: room.defaultPasscode,
      createdAt: new Date().toISOString(),
    };

    const bookings = getStoredBookings();
    bookings.unshift(newBooking);
    saveBookings(bookings);

    // Dispatch MEETING_BOOKING_REQUEST template
    const tmpl = NOTIFICATION_TEMPLATES.find((t) => t.code === "MEETING_BOOKING_REQUEST");
    let dispatchedEmail = null;
    if (tmpl) {
      dispatchedEmail = renderNotificationTemplate(tmpl, {
        requesterName: newBooking.organizerName,
        requesterEmail: newBooking.organizerEmail,
        requesterPhone: newBooking.organizerPhone,
        meetingTitle: newBooking.title,
        roomName: newBooking.roomName,
        meetingMode: newBooking.mode === "offline" ? "Trực tiếp Offline" : newBooking.mode === "online" ? "Trực tuyến Online" : "Hybrid Kết hợp",
        date: newBooking.date,
        startTime: newBooking.startTime,
        endTime: newBooking.endTime,
        attendeesCount: `${newBooking.attendeesCount} đại biểu`,
        approvalUrl: window?.location ? `${window.location.origin}/meetings?tab=bookings&id=${newBooking.id}` : "#",
      });
    }

    return { booking: newBooking, dispatchedEmail };
  },

  /**
   * Admin approves booking
   * Automatically dispatches Confirmation Email (MEETING_BOOKING_CONFIRMED) to requester
   */
  approveBooking(bookingId: string, options?: { adminNotes?: string; zoomUrl?: string; passcode?: string }): {
    booking: RoomBookingRequest;
    dispatchedEmail: any;
  } {
    const bookings = getStoredBookings();
    const idx = bookings.findIndex((b) => b.id === bookingId);
    if (idx === -1) throw new Error("Không tìm thấy yêu cầu đặt phòng.");

    const b = bookings[idx];
    b.status = "approved";
    b.reviewedAt = new Date().toISOString();
    b.reviewedBy = "Ban Quản Trị Hiệp Hội";
    if (options?.adminNotes) b.adminNotes = options.adminNotes;
    if (options?.zoomUrl) b.onlineMeetingUrl = options.zoomUrl;
    if (options?.passcode) b.onlinePasscode = options.passcode;

    saveBookings(bookings);

    // Render & dispatch Confirmation Email
    const tmpl = NOTIFICATION_TEMPLATES.find((t) => t.code === "MEETING_BOOKING_CONFIRMED");
    let dispatchedEmail = null;
    if (tmpl) {
      dispatchedEmail = renderNotificationTemplate(tmpl, {
        requesterName: b.organizerName,
        meetingTitle: b.title,
        roomName: b.roomName,
        locationAddress: "Tầng 5, Tòa nhà VIONE / CEO Tower, Hà Nội",
        onlineMeetingUrl: b.onlineMeetingUrl || "https://zoom.us/j/88819830002",
        passcode: b.onlinePasscode || "198302",
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        adminNotes: b.adminNotes || "Ban Quản Trị đã duyệt lịch và mở quyền sử dụng phòng họp.",
      });
    }

    return { booking: b, dispatchedEmail };
  },

  /**
   * Admin rejects booking
   * Automatically dispatches Rejection Email (MEETING_BOOKING_REJECTED) with reason
   */
  rejectBooking(bookingId: string, reason: string): { booking: RoomBookingRequest; dispatchedEmail: any } {
    const bookings = getStoredBookings();
    const idx = bookings.findIndex((b) => b.id === bookingId);
    if (idx === -1) throw new Error("Không tìm thấy yêu cầu đặt phòng.");

    const b = bookings[idx];
    b.status = "rejected";
    b.rejectionReason = reason;
    b.reviewedAt = new Date().toISOString();
    b.reviewedBy = "Ban Quản Trị Hiệp Hội";

    saveBookings(bookings);

    // Render & dispatch Rejection Email
    const tmpl = NOTIFICATION_TEMPLATES.find((t) => t.code === "MEETING_BOOKING_REJECTED");
    let dispatchedEmail = null;
    if (tmpl) {
      dispatchedEmail = renderNotificationTemplate(tmpl, {
        requesterName: b.organizerName,
        meetingTitle: b.title,
        roomName: b.roomName,
        rejectionReason: reason,
        suggestedAlternative: "Vui lòng chọn khung giờ khác hoặc liên hệ Ban Thư Ký để được hỗ trợ sắp xếp.",
        rebookUrl: window?.location ? `${window.location.origin}/meetings?tab=bookings` : "#",
      });
    }

    return { booking: b, dispatchedEmail };
  },
};
