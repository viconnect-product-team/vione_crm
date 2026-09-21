import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRightLeft,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  ExternalLink,
  Eye,
  FileCheck,
  FileCode,
  FileText,
  Filter,
  Layers,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Plus,
  QrCode,
  Radio,
  RefreshCw,
  Send,
  Server,
  Share2,
  ShieldCheck,
  Smartphone,
  Square,
  Tag,
  Trash2,
  Users,
  Users2,
  Video,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/dashboard/AppShell";
import { Card, PageHeader, Pill, StatCard } from "@/components/dashboard/PageKit";
import {
  cancelMeetingFn,
  createMeetingFn,
  deleteMeetingFn,
  listMeetingsFn,
  updateMeetingFn,
  type Meeting,
} from "@/lib/meetings.functions";
import { createNotificationFn } from "@/lib/notifications.functions";
import { useFmt, useT, type TKey } from "@/lib/i18n";
import {
  RoomBookingService,
  type MeetingRoom,
  type RoomBookingRequest,
} from "@/lib/room-booking.functions";
import {
  NOTIFICATION_TEMPLATES,
  renderNotificationTemplate,
  type NotificationTemplate,
  type TemplateCategory,
} from "@/lib/notification-templates";
import {
  DataPipelineService,
  type PipelineEventLog,
} from "@/lib/data-pipeline-architecture";

export const Route = createFileRoute("/meetings")({
  ssr: false,
  loader: () => listMeetingsFn(),
  component: MeetingsPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-6 text-sm text-destructive">
      {error.message}
    </div>
  ),
});

const TYPE_KEY: Record<Meeting["type"], TKey> = {
  board: "meet.type.board",
  committee: "meet.type.committee",
  general: "meet.type.general",
};
const STATUS_KEY: Record<Meeting["status"], TKey> = {
  upcoming: "meet.status.upcoming",
  completed: "meet.status.completed",
  cancelled: "meet.status.cancelled",
};
const STATUS_COLOR: Record<Meeting["status"], "info" | "success" | "danger"> = {
  upcoming: "info",
  completed: "success",
  cancelled: "danger",
};

// Department member registry of CEO 1983
const DEPARTMENT_MEMBERS: Record<
  string,
  Array<{ name: string; email: string; role: string; phone: string }>
> = {
  "Ban Thư ký": [
    { name: "Lê Hoàng Long", email: "ceo.tongthuky@ceo1983.com", role: "Tổng thư ký", phone: "0983000001" },
    { name: "Đỗ Thị Mai", email: "ceo.member1@ceo1983.com", role: "Ủy viên Thư ký", phone: "0983000006" },
  ],
  "Ban Thành viên": [
    { name: "Nguyễn Văn Cường", email: "ceo.thanhvien@ceo1983.com", role: "Trưởng ban thành viên", phone: "0983000002" },
    { name: "Bùi Đức Thắng", email: "ceo.member2@ceo1983.com", role: "Phó ban thành viên", phone: "0983000007" },
  ],
  "Ban Tài chính": [
    { name: "Vũ Thu Trang", email: "ceo.taichinh@ceo1983.com", role: "Trưởng ban tài chính", phone: "0983000003" },
    { name: "Ngô Bảo Anh", email: "ceo.member3@ceo1983.com", role: "Ủy viên Tài chính", phone: "0983000008" },
  ],
  "Ban Truyền thông": [
    { name: "Phạm Quang Huy", email: "ceo.truyenthong@ceo1983.com", role: "Trưởng ban truyền thông", phone: "0983000004" },
    { name: "Đinh Trọng Hiếu", email: "ceo.member4@ceo1983.com", role: "Ủy viên Truyền thông", phone: "0983000009" },
  ],
  "Ban Xúc tiến thương mại": [
    { name: "Hoàng Minh Tuấn", email: "ceo.xuctien@ceo1983.com", role: "Trưởng ban xúc tiến", phone: "0983000005" },
    { name: "Trịnh Kim Oanh", email: "ceo.member5@ceo1983.com", role: "Ủy viên Xúc tiến", phone: "0983000010" },
  ],
  "Toàn thể Ban Chấp Hành": [
    { name: "Lê Hoàng Long", email: "ceo.tongthuky@ceo1983.com", role: "Tổng thư ký", phone: "0983000001" },
    { name: "Nguyễn Văn Cường", email: "ceo.thanhvien@ceo1983.com", role: "Trưởng ban thành viên", phone: "0983000002" },
    { name: "Vũ Thu Trang", email: "ceo.taichinh@ceo1983.com", role: "Trưởng ban tài chính", phone: "0983000003" },
    { name: "Phạm Quang Huy", email: "ceo.truyenthong@ceo1983.com", role: "Trưởng ban truyền thông", phone: "0983000004" },
    { name: "Hoàng Minh Tuấn", email: "ceo.xuctien@ceo1983.com", role: "Trưởng ban xúc tiến", phone: "0983000005" },
  ],
};

type ActiveMeetingTab = "meetings" | "room_bookings" | "templates" | "data_pipeline";

function MeetingsPage() {
  const t: any = useT();
  const fmt = useFmt();
  const router = useRouter();
  const MEETINGS = Route.useLoaderData() as Meeting[];

  const createFn = useServerFn(createMeetingFn);
  const updateFn = useServerFn(updateMeetingFn);
  const cancelFn = useServerFn(cancelMeetingFn);
  const deleteFn = useServerFn(deleteMeetingFn);
  const createNotif = useServerFn(createNotificationFn);

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<ActiveMeetingTab>("room_bookings");

  // --- TAB 1: Meetings State ---
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<Meeting["type"]>("committee");
  const [formDepartment, setFormDepartment] = useState("Ban Xúc tiến thương mại");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("14:30");
  const [formLocation, setFormLocation] = useState("Văn phòng CLB CEO 1983 & Trực tuyến Zoom");
  const [formZoomUrl, setFormZoomUrl] = useState("https://zoom.us/j/88819839999");
  const [formStatus, setFormStatus] = useState<Meeting["status"]>("upcoming");

  const deptMembers = useMemo(() => {
    return DEPARTMENT_MEMBERS[formDepartment] || [];
  }, [formDepartment]);

  // --- TAB 2: Room Bookings & Approval State ---
  const [rooms, setRooms] = useState<MeetingRoom[]>(() => RoomBookingService.getRooms());
  const [bookings, setBookings] = useState<RoomBookingRequest[]>(() => RoomBookingService.getBookings());
  const [bookingFilter, setBookingFilter] = useState<"all" | "pending_admin" | "approved" | "rejected">("all");
  const [bookRoomModalOpen, setBookRoomModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<RoomBookingRequest | null>(null);

  // Approval form state
  const [adminNotes, setAdminNotes] = useState("Ban Quản Trị đã kiểm tra lịch và chuẩn bị sẵn thiết bị.");
  const [approvalZoomUrl, setApprovalZoomUrl] = useState("https://zoom.us/j/88819830002?pwd=VIONE");
  const [approvalPasscode, setApprovalPasscode] = useState("198302");
  const [rejectionReason, setRejectionReason] = useState("Trùng lịch hội nghị của Ban Chấp Hành Hiệp hội.");

  // New Booking Request Form State
  const [newRoomId, setNewRoomId] = useState("room_sapphire");
  const [newTitle, setNewTitle] = useState("Họp Ban Xúc Tiến Thương Mại");
  const [newOrganizerName, setNewOrganizerName] = useState("Lê Hoàng Long");
  const [newOrganizerEmail, setNewOrganizerEmail] = useState("long.le@ceo1983.com");
  const [newOrganizerPhone, setNewOrganizerPhone] = useState("0983 000 001");
  const [newDepartment, setNewDepartment] = useState("Ban Xúc tiến thương mại");
  const [newMode, setNewMode] = useState<"offline" | "online" | "hybrid">("hybrid");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newStartTime, setNewStartTime] = useState("14:30");
  const [newEndTime, setNewEndTime] = useState("16:30");
  const [newAttendeesCount, setNewAttendeesCount] = useState(15);
  const [newEquipment, setNewEquipment] = useState<string[]>(["TV tương tác 85 inch", "Camera Polycom 4K AI Tracking"]);
  const [newPurpose, setNewPurpose] = useState("Bàn kế hoạch triển khai kết nối giao thương các hội viên quý tới.");

  // Dispatched Email Preview Modal
  const [emailPreviewModalOpen, setEmailPreviewModalOpen] = useState(false);
  const [previewEmailData, setPreviewEmailData] = useState<{ subject: string; htmlBody: string } | null>(null);

  // --- TAB 3: Templates State ---
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>("room_booking");
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate>(
    () => NOTIFICATION_TEMPLATES.find((t) => t.category === "room_booking") || NOTIFICATION_TEMPLATES[0]
  );
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [sampleVars, setSampleVars] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    NOTIFICATION_TEMPLATES[0].variables.forEach((v) => {
      init[v.key] = v.example;
    });
    return init;
  });

  // Switch template
  const handleSelectTemplate = (tmpl: NotificationTemplate) => {
    setSelectedTemplate(tmpl);
    const newVars: Record<string, string> = {};
    tmpl.variables.forEach((v) => {
      newVars[v.key] = v.example;
    });
    setSampleVars(newVars);
  };

  const renderedCurrentTemplate = useMemo(() => {
    return renderNotificationTemplate(selectedTemplate, sampleVars);
  }, [selectedTemplate, sampleVars]);

  // --- TAB 4: Data Pipeline State ---
  const [pipelineMetrics] = useState(() => DataPipelineService.getMetrics());
  const [pipelineTopics] = useState(() => DataPipelineService.getTopics());
  const [redisSpec] = useState(() => DataPipelineService.getRedisConfig());
  const [pipelineLogs, setPipelineLogs] = useState<PipelineEventLog[]>(() => DataPipelineService.getLogs());

  const handleTestPublish = () => {
    const log = DataPipelineService.publishEvent(
      "crm_to_mobile",
      "vione:crm:to:mobile",
      JSON.stringify({
        event: "ADMIN_BROADCAST_SYNC",
        association: "CEO 1983",
        timestamp: new Date().toISOString(),
      })
    );
    setPipelineLogs([...DataPipelineService.getLogs()]);
    toast.success("Đã bắn gói tin đồng bộ thời gian thực qua Redis Pub/Sub xuống 2 ứng dụng Vione!");
  };

  // --- Handlers for TAB 1 (Meetings) ---
  const handleOpenCreate = () => {
    setSelectedMeeting(null);
    setFormTitle("Họp Ban: Triển khai kế hoạch hoạt động");
    setFormType("committee");
    setFormDepartment("Ban Xúc tiến thương mại");
    const initialEmails = (DEPARTMENT_MEMBERS["Ban Xúc tiến thương mại"] || []).map((m) => m.email);
    setSelectedMembers(initialEmails);
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormTime("14:30");
    setFormLocation("Zoom Meeting ID: 888 1983 9999 (Pass: 1983)");
    setFormZoomUrl("https://zoom.us/j/88819839999");
    setFormStatus("upcoming");
    setModalOpen(true);
  };

  const handleOpenEdit = (m: Meeting) => {
    setSelectedMeeting(m);
    setFormTitle(m.title);
    setFormType(m.type);
    setFormDepartment(m.department || "Ban Xúc tiến thương mại");
    const existingEmails = Array.isArray(m.targetMembers)
      ? m.targetMembers.map((tm) => (typeof tm === "string" ? tm : tm.email))
      : [];
    setSelectedMembers(existingEmails);
    setFormDate(m.date);
    setFormTime(m.time);
    setFormLocation(m.location);
    setFormZoomUrl(m.zoomUrl || "https://zoom.us/j/88819839999");
    setFormStatus(m.status);
    setModalOpen(true);
  };

  const toggleMemberSelection = (email: string) => {
    setSelectedMembers((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const selectAllDeptMembers = () => {
    setSelectedMembers(deptMembers.map((m) => m.email));
  };

  const handleSaveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error(t("common.required"));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formTitle.trim(),
        type: formType,
        date: formDate,
        time: formTime,
        location: formLocation.trim(),
        attendees: selectedMembers.length,
        status: formStatus,
        department: formDepartment,
        targetMembers: selectedMembers,
        zoomUrl: formZoomUrl.trim(),
      };

      if (selectedMeeting) {
        await updateFn({ data: { id: selectedMeeting.id, ...payload } });
        toast.success(t("common.updated"));
      } else {
        await createFn({ data: payload });
        toast.success(
          `Đã tạo cuộc họp và gửi thông báo & link Zoom tới ${selectedMembers.length} thành viên ${formDepartment}!`
        );
      }
      setModalOpen(false);
      await router.invalidate();
    } catch (err: any) {
      toast.error(err?.message || t("common.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCancel = (m: Meeting) => {
    setSelectedMeeting(m);
    setCancelReason("");
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeeting || !cancelReason.trim()) return;

    setSubmitting(true);
    try {
      await cancelFn({
        data: {
          id: selectedMeeting.id,
          reason: cancelReason.trim(),
        },
      });

      // Phát thông báo in-app đồng bộ tới ViOne App, Member App và CRM
      try {
        await createNotif({
          data: {
            title: `[Thông báo huỷ cuộc họp] ${selectedMeeting.title}`,
            body: `Cuộc họp "${selectedMeeting.title}" vào ngày ${selectedMeeting.date} lúc ${selectedMeeting.time} đã bị huỷ. Lý do: "${cancelReason.trim()}". Kính báo các thành viên tham dự sắp xếp lại lịch trình.`,
            audience: "all",
            channel: "inapp",
            appScope: "all",
            targetApp: "all",
            status: "sent",
          },
        });
      } catch (e) {
        console.warn("Could not dispatch in-app notification for cancelled meeting:", e);
      }

      toast.success(
        `Đã hủy cuộc họp "${selectedMeeting.title}" và phát thông báo in-app tới tất cả người tham gia!`
      );
      setCancelModalOpen(false);
      await router.invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi hủy cuộc họp");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (m: Meeting) => {
    if (!window.confirm(t("meet.deleteConfirm", { title: m.title }))) return;
    try {
      await deleteFn({ data: { id: m.id } });
      toast.success(t("common.deleted"));
      await router.invalidate();
    } catch (err: any) {
      toast.error(err?.message || t("common.deleteError"));
    }
  };

  // --- Handlers for TAB 2 (Room Bookings) ---
  const handleCreateRoomBooking = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { booking, dispatchedEmail } = RoomBookingService.requestBooking({
        roomId: newRoomId,
        title: newTitle,
        organizerName: newOrganizerName,
        organizerEmail: newOrganizerEmail,
        organizerPhone: newOrganizerPhone,
        department: newDepartment,
        mode: newMode,
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        attendeesCount: Number(newAttendeesCount),
        equipmentRequested: newEquipment,
        purpose: newPurpose,
      });

      setBookings(RoomBookingService.getBookings());
      setBookRoomModalOpen(false);

      if (dispatchedEmail) {
        setPreviewEmailData(dispatchedEmail);
        setEmailPreviewModalOpen(true);
      }

      toast.success("Đã gửi yêu cầu mượn phòng họp tới Ban Quản Trị và gửi email thông báo!");
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi gửi yêu cầu book phòng");
    }
  };

  const handleOpenApprove = (b: RoomBookingRequest) => {
    setSelectedBooking(b);
    setApprovalZoomUrl(b.onlineMeetingUrl || "https://zoom.us/j/88819830002?pwd=VIONE");
    setApprovalPasscode(b.onlinePasscode || "198302");
    setAdminNotes("Ban Quản Trị đã duyệt lịch. Đã chuẩn bị sẵn màn hình LED, mic và kỹ thuật viên trực phòng.");
    setApproveModalOpen(true);
  };

  const handleConfirmApprove = () => {
    if (!selectedBooking) return;
    try {
      const { booking, dispatchedEmail } = RoomBookingService.approveBooking(selectedBooking.id, {
        adminNotes,
        zoomUrl: approvalZoomUrl,
        passcode: approvalPasscode,
      });

      setBookings(RoomBookingService.getBookings());
      setApproveModalOpen(false);

      if (dispatchedEmail) {
        setPreviewEmailData(dispatchedEmail);
        setEmailPreviewModalOpen(true);
      }

      toast.success(
        `Đã phê duyệt phòng họp "${booking.roomName}"! Email xác nhận đã tự động gửi tới ${booking.organizerEmail}.`
      );
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi phê duyệt");
    }
  };

  const handleOpenReject = (b: RoomBookingRequest) => {
    setSelectedBooking(b);
    setRejectionReason("Trùng lịch hội nghị chuyên đề của Ban Chấp Hành Hiệp hội.");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedBooking) return;
    try {
      const { booking, dispatchedEmail } = RoomBookingService.rejectBooking(
        selectedBooking.id,
        rejectionReason
      );

      setBookings(RoomBookingService.getBookings());
      setRejectModalOpen(false);

      if (dispatchedEmail) {
        setPreviewEmailData(dispatchedEmail);
        setEmailPreviewModalOpen(true);
      }

      // Đẩy thông báo in-app huỷ/từ chối đặt phòng kèm yêu cầu chọn khung giờ khác
      try {
        await createNotif({
          data: {
            title: `[Huỷ đặt phòng họp] ${booking.title} — ${booking.roomName}`,
            body: `Yêu cầu đặt phòng "${booking.roomName}" (${booking.startTime} - ${booking.endTime}, ngày ${booking.date}) của ${booking.organizerName} (${booking.organizerEmail}) đã bị từ chối/huỷ. Lý do: "${rejectionReason}". Quý hội viên vui lòng chọn khung giờ khác hoặc liên hệ Ban Thư Ký để được hỗ trợ sắp xếp lại.`,
            audience: "all",
            channel: "inapp",
            appScope: "all",
            targetApp: "all",
            status: "sent",
          },
        });
      } catch (notifErr) {
        console.warn("Could not dispatch in-app notification for rejected booking:", notifErr);
      }

      toast.success(
        `Đã từ chối/huỷ đặt phòng, gửi thông báo in-app và email hướng dẫn chọn khung giờ khác tới ${booking.organizerEmail}.`
      );
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi từ chối");
    }
  };

  const filteredBookings = useMemo(() => {
    if (bookingFilter === "all") return bookings;
    return bookings.filter((b) => b.status === bookingFilter);
  }, [bookings, bookingFilter]);

  return (
    <AppShell>
      {/* Header */}
      <PageHeader
        title="Quản Lý Cuộc Họp & Đặt Phòng Họp Thông Minh"
        subtitle="Hệ thống đăng ký book phòng Online/Offline, quy trình duyệt email tự động, kho mẫu template và hạ tầng đồng bộ Redis-Kafka"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === "meetings" && (
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-95"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Plus className="h-4 w-4" />
                Tạo Cuộc Họp Ban
              </button>
            )}
            {activeTab === "room_bookings" && (
              <button
                onClick={() => setBookRoomModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-95"
                style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)" }}
              >
                <Plus className="h-4 w-4" />
                Đăng Ký Đặt Phòng Họp
              </button>
            )}
            {activeTab === "data_pipeline" && (
              <button
                onClick={handleTestPublish}
                className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition"
              >
                <Radio className="h-4 w-4 animate-pulse text-emerald-500" />
                Bắn Gói Tin Thử Nghiệm
              </button>
            )}
          </div>
        }
      />

      {/* Modern 4-Tab Switcher */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab("room_bookings")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
            activeTab === "room_bookings"
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <MapPin className="h-4 w-4" />
          <span>Đặt Phòng & Phê Duyệt Email</span>
          <span className="ml-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400 font-extrabold">
            {bookings.filter((b) => b.status === "pending_admin").length} Chờ Duyệt
          </span>
        </button>

        <button
          onClick={() => setActiveTab("meetings")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
            activeTab === "meetings"
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Lịch Họp Ban & Sự Kiện ({MEETINGS.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("templates")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
            activeTab === "templates"
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <Mail className="h-4 w-4" />
          <span>Mẫu Email & Tin Nhắn Cố Định ({NOTIFICATION_TEMPLATES.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("data_pipeline")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
            activeTab === "data_pipeline"
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Hạ Tầng Redis & Message Queue</span>
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 2: ĐẶT PHÒNG HỌP & PHÊ DUYỆT (ONLINE & OFFLINE)                   */}
      {/* ==================================================================== */}
      {activeTab === "room_bookings" && (
        <div className="space-y-6">
          {/* Rooms Grid */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Các Phòng Họp Sẵn Có Trong Hệ Thống
              </h2>
              <span className="text-xs text-muted-foreground">Hỗ trợ đầy đủ Online, Offline & Hybrid</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {rooms.map((rm) => (
                <Card key={rm.id} className="p-4 border border-border/80 hover:border-primary/50 transition shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        rm.type === "hybrid"
                          ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                          : rm.type === "online"
                          ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {rm.type === "hybrid" ? "Hybrid (Trực tiếp & Online)" : rm.type === "online" ? "Online Studio" : "Phòng Offline"}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" /> {rm.capacity} chỗ
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-foreground line-clamp-1">{rm.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rm.location}</p>

                  <div className="mt-3 pt-3 border-t border-border/60">
                    <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Trang thiết bị:</p>
                    <div className="flex flex-wrap gap-1">
                      {rm.equipment.slice(0, 3).map((eq, i) => (
                        <span key={i} className="text-[10px] bg-secondary px-2 py-0.5 rounded-md text-foreground/80">
                          {eq}
                        </span>
                      ))}
                      {rm.equipment.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{rm.equipment.length - 3}</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setNewRoomId(rm.id);
                      setBookRoomModalOpen(true);
                    }}
                    className="w-full mt-3 rounded-lg bg-secondary/80 hover:bg-primary hover:text-primary-foreground py-1.5 text-xs font-semibold transition"
                  >
                    Đặt phòng này
                  </button>
                </Card>
              ))}
            </div>
          </div>

          {/* Bookings & Approvals Section */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-border/60">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-emerald-600" />
                  Danh Sách Đăng Ký Đặt Phòng & Luồng Phê Duyệt Quản Trị
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Thành viên đăng ký -&gt; Chờ Admin phê duyệt -&gt; Hệ thống tự động gửi email xác nhận kèm link họp hoặc địa chỉ
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-secondary/50 p-1 rounded-xl">
                {(["all", "pending_admin", "approved", "rejected"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setBookingFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      bookingFilter === st
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {st === "all"
                      ? "Tất cả"
                      : st === "pending_admin"
                      ? "Chờ duyệt"
                      : st === "approved"
                      ? "Đã duyệt"
                      : "Từ chối"}
                  </button>
                ))}
              </div>
            </div>

            {/* Bookings Table / Cards */}
            <div className="space-y-3">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Không tìm thấy yêu cầu đặt phòng nào phù hợp.
                </div>
              ) : (
                filteredBookings.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-xl border border-border/80 bg-background/50 p-4 transition hover:border-border hover:shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                            {b.id}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                              b.status === "approved"
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : b.status === "rejected"
                                ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                                : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            }`}
                          >
                            {b.status === "approved"
                              ? "✓ Đã Phê Duyệt"
                              : b.status === "rejected"
                              ? "✗ Từ Chối"
                              : "⏳ Chờ Quản Trị Duyệt"}
                          </span>
                          <span className="text-xs font-semibold text-primary">
                            {b.roomName}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-foreground">{b.title}</h3>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <Clock className="h-3.5 w-3.5 text-primary" /> {b.startTime} - {b.endTime} | Ngày {b.date}
                          </span>
                          <span>
                            Người đặt: <strong>{b.organizerName}</strong> ({b.department})
                          </span>
                          <span>Email: {b.organizerEmail}</span>
                          <span>Quy mô: {b.attendeesCount} đại biểu</span>
                        </div>

                        {b.onlineMeetingUrl && b.status === "approved" && (
                          <div className="flex items-center gap-2 pt-1 text-xs">
                            <Video className="h-3.5 w-3.5 text-blue-600" />
                            <span className="text-muted-foreground">Link họp Online:</span>
                            <a
                              href={b.onlineMeetingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {b.onlineMeetingUrl} <ExternalLink className="h-3 w-3" />
                            </a>
                            {b.onlinePasscode && (
                              <span className="text-muted-foreground">
                                (Passcode: <strong className="text-foreground">{b.onlinePasscode}</strong>)
                              </span>
                            )}
                          </div>
                        )}

                        {b.rejectionReason && b.status === "rejected" && (
                          <p className="text-xs text-rose-600 pt-1 font-medium">
                            Lý do từ chối: {b.rejectionReason}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {b.status === "pending_admin" && (
                          <>
                            <button
                              onClick={() => handleOpenApprove(b)}
                              className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Phê Duyệt & Gửi Mail
                            </button>
                            <button
                              onClick={() => handleOpenReject(b)}
                              className="rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400 transition flex items-center gap-1.5"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Từ Chối
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => {
                            const tmpl = NOTIFICATION_TEMPLATES.find((t) =>
                              b.status === "approved"
                                ? t.code === "MEETING_BOOKING_CONFIRMED"
                                : b.status === "rejected"
                                ? t.code === "MEETING_BOOKING_REJECTED"
                                : t.code === "MEETING_BOOKING_REQUEST"
                            );
                            if (tmpl) {
                              const rendered = renderNotificationTemplate(tmpl, {
                                requesterName: b.organizerName,
                                meetingTitle: b.title,
                                roomName: b.roomName,
                                locationAddress: "Tầng 5 Tòa nhà CEO Tower, Hà Nội",
                                onlineMeetingUrl: b.onlineMeetingUrl || "https://zoom.us/j/88819830002",
                                passcode: b.onlinePasscode || "198302",
                                date: b.date,
                                startTime: b.startTime,
                                endTime: b.endTime,
                                attendeesCount: `${b.attendeesCount} đại biểu`,
                                rejectionReason: b.rejectionReason || "Trùng lịch họp Ban Chấp Hành",
                                suggestedAlternative: "Chọn khung giờ khác hoặc liên hệ Ban Thư Ký",
                                adminNotes: b.adminNotes || "Ban Quản Trị đã duyệt lịch.",
                              });
                              setPreviewEmailData(rendered);
                              setEmailPreviewModalOpen(true);
                            }
                          }}
                          className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition flex items-center gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" /> Xem Mẫu Mail
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 1: LỊCH HỌP BAN & SỰ KIỆN (EXISTING MEETINGS GRID)                 */}
      {/* ==================================================================== */}
      {activeTab === "meetings" && (
        <>
          {/* KPI Cards */}
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label={t("meet.kpi.total")}
              value={MEETINGS.length}
              icon={<Users2 className="h-4 w-4" />}
            />
            <StatCard
              label={t("meet.kpi.upcoming")}
              value={MEETINGS.filter((m) => m.status === "upcoming").length}
              tone="info"
              icon={<Calendar className="h-4 w-4" />}
            />
            <StatCard
              label="Đã Hủy Hoặc Hoàn Tất"
              value={MEETINGS.filter((m) => m.status !== "upcoming").length}
              tone="success"
              icon={<Clock className="h-4 w-4" />}
            />
          </div>

          {/* Meetings Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {MEETINGS.map((m) => (
              <Card key={m.id} className="p-5 transition hover:shadow-[var(--shadow-glow)]">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Pill color={STATUS_COLOR[m.status]}>{t(STATUS_KEY[m.status])}</Pill>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t(TYPE_KEY[m.type])}
                    </span>
                  </div>
                  {m.department && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                      {m.department}
                    </span>
                  )}
                </div>

                <h3 className="mb-2 text-base font-bold text-foreground">{m.title}</h3>

                {m.status === "cancelled" && m.cancelReason && (
                  <div className="mb-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-700 dark:text-rose-400">
                    <div className="flex items-center gap-1 font-bold">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Đã hủy cuộc họp
                    </div>
                    <div className="mt-1">Lý do: {m.cancelReason}</div>
                  </div>
                )}

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span>
                      {fmt.date(m.date)} lúc {m.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span className="truncate">{m.location}</span>
                  </div>
                  {m.zoomUrl && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Video className="h-3.5 w-3.5" />
                      <a href={m.zoomUrl} target="_blank" rel="noreferrer" className="truncate hover:underline">
                        {m.zoomUrl}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <span>{t("meet.attendeesCount", { count: m.attendees })}</span>
                  </div>
                </div>

                {/* Target members tag cloud */}
                {Array.isArray(m.targetMembers) && m.targetMembers.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1 border-t border-border/50 pt-2">
                    {m.targetMembers.slice(0, 4).map((tm: any, idx: number) => {
                      const emailStr = typeof tm === "string" ? tm : tm.email;
                      const nameStr = typeof tm === "object" ? tm.name : emailStr.split("@")[0];
                      return (
                        <span
                          key={idx}
                          className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground/80"
                        >
                          {nameStr}
                        </span>
                      );
                    })}
                    {m.targetMembers.length > 4 && (
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        +{m.targetMembers.length - 4} khác
                      </span>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="mt-4 flex items-center justify-end gap-2 border-t border-border/50 pt-3">
                  {m.status === "upcoming" && (
                    <button
                      onClick={() => handleOpenCancel(m)}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      Hủy họp
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenEdit(m)}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => onDelete(m)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: KHO MẪU EMAIL & TIN NHẮN CỐ ĐỊNH                              */}
      {/* ==================================================================== */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Category & Template Selector */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                Danh Mục Luồng Thông Báo
              </p>
              <div className="space-y-1">
                {[
                  { id: "room_booking", label: "1. Luồng Đặt Phòng Họp", icon: MapPin },
                  { id: "payment", label: "2. Luồng Thanh Toán & VietQR", icon: Tag },
                  { id: "event", label: "3. Luồng Sự Kiện & Vé Mời QR", icon: QrCode },
                  { id: "cross_app", label: "4. Luồng 2 App Vione Trong Hiệp Hội", icon: Smartphone },
                ].map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id as TemplateCategory);
                        const first = NOTIFICATION_TEMPLATES.find((t) => t.category === cat.id);
                        if (first) handleSelectTemplate(first);
                      }}
                      className={`w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold text-left transition ${
                        selectedCategory === cat.id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Template List in Category */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Các Mẫu Template Cố Định
              </p>
              {NOTIFICATION_TEMPLATES.filter((t) => t.category === selectedCategory).map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => handleSelectTemplate(tmpl)}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    selectedTemplate.id === tmpl.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/70 hover:border-border hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-[10px] font-bold text-primary">{tmpl.code}</span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Lock className="h-2.5 w-2.5" /> Chuẩn hoá
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-foreground line-clamp-1">{tmpl.name}</h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                    {tmpl.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Template Preview & Tester */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-border">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" /> {selectedTemplate.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Mã template: <strong className="font-mono text-primary">{selectedTemplate.code}</strong> | Kênh:{" "}
                    {selectedTemplate.channels.join(", ").toUpperCase()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-secondary rounded-xl p-1 text-xs">
                    <button
                      onClick={() => setPreviewDevice("desktop")}
                      className={`px-3 py-1 rounded-lg font-bold transition ${
                        previewDevice === "desktop" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      Desktop
                    </button>
                    <button
                      onClick={() => setPreviewDevice("mobile")}
                      className={`px-3 py-1 rounded-lg font-bold transition ${
                        previewDevice === "mobile" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      Mobile App
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      toast.success(
                        `Đã gửi thông báo thử nghiệm mẫu [${selectedTemplate.code}] tới tài khoản của bạn!`
                      );
                    }}
                    className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-95 transition flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" /> Gửi Thử Nghiệm
                  </button>
                </div>
              </div>

              {/* Subject & In-App Preview Banner */}
              <div className="rounded-xl bg-secondary/50 p-3.5 space-y-2 mb-4 text-xs">
                <div>
                  <span className="font-semibold text-muted-foreground">Tiêu đề Email (Subject):</span>
                  <p className="font-bold text-foreground mt-0.5">{renderedCurrentTemplate.subject}</p>
                </div>
                <div className="pt-2 border-t border-border/60">
                  <span className="font-semibold text-muted-foreground">Thông báo In-App / Push:</span>
                  <p className="font-bold text-foreground mt-0.5">{renderedCurrentTemplate.inAppTitle}</p>
                  <p className="text-muted-foreground mt-0.5">{renderedCurrentTemplate.inAppBody}</p>
                </div>
              </div>

              {/* Live Rendered HTML Container */}
              <div className="border border-border/80 rounded-xl overflow-hidden bg-muted/20 p-4">
                <div
                  className={`mx-auto transition-all ${
                    previewDevice === "mobile" ? "max-w-sm shadow-xl rounded-2xl border-4 border-gray-800 p-2 bg-white" : "max-w-2xl"
                  }`}
                >
                  <div
                    dangerouslySetInnerHTML={{ __html: renderedCurrentTemplate.htmlBody }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: HẠ TẦNG REDIS & MESSAGE QUEUE PIPELINE                         */}
      {/* ==================================================================== */}
      {activeTab === "data_pipeline" && (
        <div className="space-y-6">
          {/* Telemetry Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {pipelineMetrics.map((m, idx) => (
              <Card key={idx} className="p-4 border border-border/80">
                <div className="text-xs font-semibold text-muted-foreground">{m.name}</div>
                <div className="text-2xl font-extrabold text-foreground mt-1">
                  {m.value} <span className="text-xs font-normal text-muted-foreground">{m.unit}</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {m.description}
                </div>
              </Card>
            ))}
          </div>

          {/* Architecture Overview */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2 mb-3">
              <Server className="h-4 w-4 text-primary" /> Sơ Đồ Luồng Dữ Liệu 2 Chiều: CRM Admin &lt;-&gt; Mobile App
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-border bg-secondary/30 space-y-2">
                <div className="font-bold text-primary flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4" /> 1. VIONE Mobile Apps (2 App)
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Ứng dụng dành cho hội viên hiệp hội. Đăng ký phòng họp, gửi phiếu đăng ký sự kiện (Google Form), thanh toán VietQR và nhận vé mời có mã QR.
                </p>
                <div className="font-mono text-[10px] bg-background p-2 rounded border border-border">
                  Emitter: REST API / WebSocket client
                </div>
              </div>

              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                <div className="font-bold text-amber-600 flex items-center gap-1.5">
                  <Zap className="h-4 w-4" /> 2. Redis & Kafka Event Bus
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Trục xử lý bất đồng bộ chống nghẽn database: Redis Pub/Sub đồng bộ tức thì, Distributed Lock chống trùng phòng họp, Kafka Topics xếp hàng xử lý email & push worker.
                </p>
                <div className="font-mono text-[10px] bg-background p-2 rounded border border-border">
                  Throughput: 2,410 msg/s | Latency: 4.6ms
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-secondary/30 space-y-2">
                <div className="font-bold text-emerald-600 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> 3. Web CRM Admin Portal
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Hệ thống quản trị tập trung: Kiểm soát đặt phòng họp, phê duyệt hoặc từ chối, xuất hoá đơn, quản lý bàn tiệc Gala và gửi thông báo đa kênh 2 chiều.
                </p>
                <div className="font-mono text-[10px] bg-background p-2 rounded border border-border">
                  Receiver: Auto WebSocket & Event Dispatcher
                </div>
              </div>
            </div>
          </div>

          {/* Topics & Live Event Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Kafka Topics Table */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> Các Event Topics Trong Message Queue
              </h3>
              <div className="space-y-2.5">
                {pipelineTopics.map((tp, idx) => (
                  <div key={idx} className="rounded-xl border border-border/70 p-3 text-xs bg-background/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-primary">{tp.topic}</span>
                      <span className="text-emerald-600 font-semibold">{tp.messagesPerSec} msg/s</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                      <span>Partitions: {tp.partitions} | Replicas: {tp.replicationFactor}</span>
                      <span>Độ trễ: {tp.avgLatencyMs} ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Event Stream Logs */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-500 animate-pulse" /> Luồng Dữ Liệu 2 Chiều Trực Tuyến
                </h3>
                <span className="text-[10px] text-muted-foreground">Live Telemetry</span>
              </div>
              <div className="space-y-2 max-h-[380px] overflow-y-auto">
                {pipelineLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-border/60 p-2.5 text-xs bg-secondary/30">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        {log.direction === "crm_to_mobile" ? (
                          <span className="text-blue-600 flex items-center gap-1">
                            CRM &rarr; Mobile
                          </span>
                        ) : (
                          <span className="text-emerald-600 flex items-center gap-1">
                            Mobile &rarr; CRM
                          </span>
                        )}
                        <span className="text-muted-foreground font-mono font-normal">[{log.channel}]</span>
                      </div>
                      <span className="text-muted-foreground">{log.timestamp}</span>
                    </div>
                    <div className="font-mono text-[11px] text-foreground/90 truncate">{log.topicOrKey}</div>
                    <div className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
                      {log.payloadSnippet}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODALS SECTION                                                       */}
      {/* ==================================================================== */}

      {/* Modal 1: Đăng Ký Đặt Phòng Họp */}
      {bookRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-600" /> Đăng Ký Sử Dụng Phòng Họp
              </h3>
              <button
                onClick={() => setBookRoomModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoomBooking} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">Chọn phòng họp *</label>
                <select
                  value={newRoomId}
                  onChange={(e) => setNewRoomId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-medium"
                >
                  {rooms.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      {rm.name} ({rm.capacity} chỗ - {rm.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Tiêu đề cuộc họp *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Họp Ban Xúc Tiến Thương Mại Quý 3"
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground block mb-1">Người đăng ký *</label>
                  <input
                    type="text"
                    required
                    value={newOrganizerName}
                    onChange={(e) => setNewOrganizerName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground block mb-1">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    value={newOrganizerPhone}
                    onChange={(e) => setNewOrganizerPhone(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground block mb-1">Email nhận phê duyệt *</label>
                  <input
                    type="email"
                    required
                    value={newOrganizerEmail}
                    onChange={(e) => setNewOrganizerEmail(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground block mb-1">Hình thức cuộc họp *</label>
                  <select
                    value={newMode}
                    onChange={(e) => setNewMode(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-sm"
                  >
                    <option value="offline">Trực tiếp (Offline)</option>
                    <option value="online">Trực tuyến (Online Zoom/Meet)</option>
                    <option value="hybrid">Hybrid (Trực tiếp kết hợp Online)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-foreground block mb-1">Ngày họp *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground block mb-1">Giờ bắt đầu *</label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground block mb-1">Giờ kết thúc *</label>
                  <input
                    type="time"
                    required
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Mục đích & Nội dung cuộc họp</label>
                <textarea
                  rows={2}
                  value={newPurpose}
                  onChange={(e) => setNewPurpose(e.target.value)}
                  placeholder="Mô tả tóm tắt nội dung để Ban Quản Trị bố trí phòng hợp lý..."
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setBookRoomModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 transition"
                >
                  Gửi Yêu Cầu Đặt Phòng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Quản Trị Viên Phê Duyệt Phòng Họp */}
      {approveModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Phê Duyệt Sử Dụng Phòng Họp
              </h3>
              <button
                onClick={() => setApproveModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 space-y-1">
                <p className="font-bold text-emerald-700 dark:text-emerald-400">
                  Cuộc họp: {selectedBooking.title}
                </p>
                <p className="text-muted-foreground">
                  Phòng: <strong>{selectedBooking.roomName}</strong> | Thời gian: {selectedBooking.startTime} - {selectedBooking.endTime} ({selectedBooking.date})
                </p>
                <p className="text-muted-foreground">
                  Người đăng ký: {selectedBooking.organizerName} ({selectedBooking.organizerEmail})
                </p>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Link họp Online (Zoom/Google Meet) cấp cho phòng:</label>
                <input
                  type="url"
                  value={approvalZoomUrl}
                  onChange={(e) => setApprovalZoomUrl(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Mật khẩu phòng (Passcode):</label>
                <input
                  type="text"
                  value={approvalPasscode}
                  onChange={(e) => setApprovalPasscode(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Ghi chú & Dặn dò của Ban Quản Trị:</label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setApproveModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApprove}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" /> Xác Nhận Duyệt & Gửi Email Xác Nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Quản Trị Viên Từ Chối Phòng Họp */}
      {rejectModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <h3 className="text-base font-bold text-rose-600 flex items-center gap-2">
                <XCircle className="h-5 w-5" /> Từ Chối Yêu Cầu Đặt Phòng
              </h3>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-muted-foreground">
                Vui lòng nhập lý do từ chối để hệ thống tự động gửi email giải thích và hướng dẫn tới người đặt.
              </p>

              <div>
                <label className="font-bold text-foreground block mb-1">Lý do từ chối *</label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ví dụ: Trùng lịch họp đột xuất của Hội đồng quản trị..."
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-rose-700 transition"
                >
                  Xác Nhận Từ Chối & Gửi Mail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Xem Mẫu Email Tự Động Đã Gửi */}
      {emailPreviewModalOpen && previewEmailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" /> Mẫu Email Đã Được Phát Tự Động
              </h3>
              <button
                onClick={() => setEmailPreviewModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl bg-secondary/50 p-3 text-xs">
                <span className="font-semibold text-muted-foreground">Tiêu đề (Subject):</span>
                <p className="font-bold text-foreground mt-0.5">{previewEmailData.subject}</p>
              </div>

              <div className="border border-border/80 rounded-xl overflow-hidden p-2 bg-white">
                <div dangerouslySetInnerHTML={{ __html: previewEmailData.htmlBody }} />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setEmailPreviewModalOpen(false)}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow"
                >
                  Đóng Hộp Thoại
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Tạo / Sửa Cuộc Họp Ban Cũ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="text-lg font-bold text-foreground">
                {selectedMeeting ? t("meet.edit") : t("meet.create")}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMeeting} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">{t("meet.fields.title")} *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ví dụ: Họp Ban Xúc tiến thương mại - Triển khai kế hoạch năm 2026"
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground block mb-1">{t("meet.fields.type")} *</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as Meeting["type"])}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-sm"
                  >
                    <option value="committee">{t("meet.type.committee")}</option>
                    <option value="board">{t("meet.type.board")}</option>
                    <option value="general">{t("meet.type.general")}</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-foreground block mb-1">Phòng ban phụ trách *</label>
                  <select
                    value={formDepartment}
                    onChange={(e) => {
                      const dept = e.target.value;
                      setFormDepartment(dept);
                      setSelectedMembers((DEPARTMENT_MEMBERS[dept] || []).map((m) => m.email));
                    }}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-sm"
                  >
                    {Object.keys(DEPARTMENT_MEMBERS).map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Department Member Picker */}
              <div className="rounded-xl border border-border bg-secondary/30 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">
                    Danh sách nhân sự {formDepartment} ({selectedMembers.length}/{deptMembers.length})
                  </span>
                  <button
                    type="button"
                    onClick={selectAllDeptMembers}
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    Chọn tất cả
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {deptMembers.map((mem) => {
                    const isSelected = selectedMembers.includes(mem.email);
                    return (
                      <div
                        key={mem.email}
                        onClick={() => toggleMemberSelection(mem.email)}
                        className={`flex items-center gap-2.5 rounded-lg border p-2 cursor-pointer transition ${
                          isSelected
                            ? "border-primary bg-primary/10 text-foreground font-semibold"
                            : "border-border/60 bg-card text-muted-foreground"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-xs">{mem.name}</p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {mem.role} · {mem.phone}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-foreground block mb-1">{t("meet.fields.date")} *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground block mb-1">{t("meet.fields.time")} *</label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground block mb-1">{t("meet.fields.status")}</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as Meeting["status"])}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-sm"
                  >
                    <option value="upcoming">{t("meet.status.upcoming")}</option>
                    <option value="completed">{t("meet.status.completed")}</option>
                    <option value="cancelled">{t("meet.status.cancelled")}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">{t("meet.fields.location")} *</label>
                <input
                  type="text"
                  required
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1 flex items-center gap-1.5">
                  <Video className="h-3.5 w-3.5 text-blue-600" />
                  Link họp Zoom trực tuyến (tự động phát tới email/app hội viên)
                </label>
                <input
                  type="url"
                  value={formZoomUrl}
                  onChange={(e) => setFormZoomUrl(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-mono text-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl px-5 py-2 text-xs font-bold text-primary-foreground shadow"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {submitting ? "Đang lưu..." : selectedMeeting ? t("common.save") : "Lên Lịch & Phát Thông Báo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 6: Hủy Cuộc Họp */}
      {cancelModalOpen && selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="text-base font-bold text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" /> Hủy Cuộc Họp & Phát Thông Báo Hủy
              </h3>
              <button
                onClick={() => setCancelModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCancel} className="space-y-4 text-xs">
              <p className="text-muted-foreground">
                Cuộc họp: <strong>{selectedMeeting.title}</strong>
              </p>
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Lý do hủy cuộc họp (sẽ được gửi tới tất cả người tham gia) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ví dụ: Lãnh đạo bận công tác đột xuất, dời lịch họp sang tuần sau..."
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-destructive px-5 py-2 text-xs font-bold text-destructive-foreground shadow hover:opacity-90"
                >
                  {submitting ? "Đang xử lý..." : "Xác Nhận Hủy Họp"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
