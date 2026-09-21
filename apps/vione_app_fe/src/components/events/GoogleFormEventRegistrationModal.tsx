import React, { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  Info,
  MapPin,
  QrCode,
  Sparkles,
  Tag,
  Upload,
  User,
  Users,
  Utensils,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { EventItem } from "@/lib/events.functions";
import { NOTIFICATION_TEMPLATES, renderNotificationTemplate } from "@/lib/notification-templates";
import { downloadIcs } from "@/lib/ics";

export interface GoogleFormRegistrationData {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  industry: string;
  role: string;
  b2bNeeds: string;
  speakerQuestions: string;
  banquetChoice: string;
  dietaryChoice: string;
  attachmentUrl: string;
}

interface GoogleFormModalProps {
  event: EventItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: GoogleFormRegistrationData, ticketCode: string) => void;
}

export function GoogleFormEventRegistrationModal({
  event,
  isOpen,
  onClose,
  onSuccess,
}: GoogleFormModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ticketCode, setTicketCode] = useState("");

  // Form State
  const [form, setForm] = useState<GoogleFormRegistrationData>({
    fullName: "Vũ Thu Trang",
    email: "ceo.taichinh@ceo1983.com",
    phone: "0983 000 003",
    company: "Công ty Cổ phần Đầu tư & Tài chính Sen Vàng",
    jobTitle: "Tổng Giám Đốc",
    industry: "Tài chính & Đầu tư",
    role: "Hội viên chính thức (Official Member)",
    b2bNeeds: "Tìm kiếm các doanh nghiệp sản xuất xuất khẩu và công nghệ để đầu tư mở rộng quy mô vốn 20-50 tỷ.",
    speakerQuestions: "Ban tổ chức có thể chia sẻ sâu hơn về cơ chế thuế mới áp dụng cho doanh nghiệp SME từ quý 4?",
    banquetChoice: "Bàn Tiệc VIP Gala 02 (Bàn Tròn 10 Chỗ)",
    dietaryChoice: "Tiệc mặn cao cấp (Standard Fine Dining)",
    attachmentUrl: "https://senvanggroup.vn/profile-2026.pdf",
  });

  // Active question focus for Google Forms border effect
  const [activeCard, setActiveCard] = useState<string | null>("fullName");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = "Đây là một câu hỏi bắt buộc";
    if (!form.email.trim()) {
      errs.email = "Đây là một câu hỏi bắt buộc";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      errs.email = "Vui lòng nhập địa chỉ email hợp lệ";
    }
    if (!form.phone.trim()) errs.phone = "Đây là một câu hỏi bắt buộc";
    if (!form.company.trim()) errs.company = "Đây là một câu hỏi bắt buộc";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Vui lòng hoàn thành tất cả câu hỏi bắt buộc (*)");
      return;
    }

    setSubmitting(true);
    try {
      const generatedTicket = `TKT-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString(36).toUpperCase().slice(-3)}`;
      setTicketCode(generatedTicket);

      // Render confirmation ticket email
      const tmpl = NOTIFICATION_TEMPLATES.find((t) => t.code === "EVENT_TICKET_CONFIRMATION");
      if (tmpl) {
        renderNotificationTemplate(tmpl, {
          attendeeName: form.fullName,
          eventName: event.name,
          ticketCode: generatedTicket,
          seatOrTable: form.banquetChoice,
          ticketType: form.role,
          eventTime: event.date,
          eventAddress: event.location || "Văn phòng Hiệp hội CEO 1983",
          qrCodeDataUrl: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=VIONE-${generatedTicket}`,
        });
      }

      // Save into local registration list for mock or real sync
      if (typeof window !== "undefined") {
        const stored = JSON.parse(localStorage.getItem("vione_event_custom_registrations") || "[]");
        stored.unshift({
          eventId: event.id,
          ticketCode: generatedTicket,
          ...form,
          submittedAt: new Date().toISOString(),
        });
        localStorage.setItem("vione_event_custom_registrations", JSON.stringify(stored));
      }

      setSubmitted(true);
      toast.success("Đăng ký thành công! Vé điện tử và mã QR đã được gửi về email.");
      if (onSuccess) onSuccess(form, generatedTicket);
    } catch {
      toast.error("Đã xảy ra lỗi khi gửi form đăng ký.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setTicketCode("");
  };

  const handleDownloadCalendar = () => {
    downloadIcs({
      uid: `${event.id}@vba-events`,
      title: event.name,
      start: event.date,
      location: event.location || undefined,
      description: `Vé tham dự: ${ticketCode} - Vị trí: ${form.banquetChoice}`,
    });
    toast.success("Đã tải tệp lịch (.ics) thành công!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-6 animate-in fade-in duration-200">
      <div className="relative my-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-[#f0ebf8] shadow-2xl border border-border">
        {/* Top bar with close */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-purple-200/50 bg-[#673ab7] px-5 py-3 text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 font-bold text-xs">
              GF
            </div>
            <span className="text-sm font-semibold tracking-wide">
              VIONE Forms · Phiếu Thu Thập Thông Tin Đại Biểu
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="max-h-[82vh] overflow-y-auto p-4 sm:p-8 space-y-4">
          {submitted ? (
            /* Google Forms Response Recorded Screen */
            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-purple-200 bg-white shadow-sm">
                <div className="h-3 bg-[#673ab7]" />
                <div className="p-6 sm:p-10 space-y-4">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                    {event.name}
                  </h1>
                  <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-xl text-sm font-medium">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                    <span>Câu trả lời của bạn đã được ghi lại thành công.</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Hệ thống đã phát sinh vé mời điện tử chính thức và gửi thông tin xác nhận kèm mã QR về địa chỉ email <strong>{form.email}</strong>.
                  </p>

                  {/* E-Ticket Preview Card */}
                  <div className="rounded-xl border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50/60 to-orange-50/40 p-5">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-2 text-center sm:text-left">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-200/80 px-2.5 py-0.5 rounded-full uppercase">
                          Mã Vé Tham Dự
                        </span>
                        <div className="text-2xl font-extrabold font-mono text-gray-900">
                          {ticketCode}
                        </div>
                        <div className="text-xs text-gray-700 space-y-0.5">
                          <div><strong>Đại biểu:</strong> {form.fullName} ({form.company})</div>
                          <div><strong>Vị trí bàn tiệc:</strong> <span className="text-emerald-700 font-bold">{form.banquetChoice}</span></div>
                          <div><strong>Thời gian:</strong> {event.date}</div>
                        </div>
                      </div>
                      <div className="text-center shrink-0">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=VIONE-${ticketCode}`}
                          alt="Ticket QR"
                          className="h-28 w-28 rounded-lg border-2 border-white shadow-md mx-auto"
                        />
                        <span className="text-[10px] text-gray-500 mt-1 block">Xuất trình tại quầy lễ tân</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleDownloadCalendar}
                      className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-gray-800 transition"
                    >
                      <CalendarDays className="h-4 w-4" /> Thêm vào Google Calendar (.ics)
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      Gửi một phản hồi khác
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#673ab7] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#5e35b1] transition"
                    >
                      Hoàn tất & Đóng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Google Forms Question Cards */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Card 1: Title & Header Card */}
              <div className="overflow-hidden rounded-xl border border-purple-200 bg-white shadow-sm">
                <div className="h-2.5 bg-[#673ab7]" />
                <div className="p-6 sm:p-8 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#673ab7]">
                    <Sparkles className="h-4 w-4" /> Bản Đăng Ký Đại Biểu & B2B Matchmaking
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug">
                    {event.name}
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Kính mời Quý Đại biểu / Quý Doanh nhân điền đầy đủ thông tin bên dưới để Ban tổ chức sắp xếp chỗ ngồi, chuẩn bị thẻ đeo đại biểu và gửi vé mời có mã QR Check-in điện tử.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-gray-500 border-t border-gray-100">
                    <span className="flex items-center gap-1.5 font-medium text-gray-700">
                      <CalendarDays className="h-3.5 w-3.5 text-[#673ab7]" /> {event.date}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-gray-700">
                      <MapPin className="h-3.5 w-3.5 text-[#673ab7]" /> {event.location || "Văn phòng Hiệp hội"}
                    </span>
                    <span className="text-red-500 font-semibold">* Bắt buộc</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Họ và tên */}
              <div
                onClick={() => setActiveCard("fullName")}
                className={`rounded-xl border bg-white p-6 shadow-sm transition-all ${
                  activeCard === "fullName" ? "border-l-4 border-l-[#673ab7] border-gray-300" : "border-gray-200"
                }`}
              >
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  1. Họ và tên đại biểu <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">Tên đầy đủ sẽ được in trên Thẻ đại biểu và Vé mời.</p>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Câu trả lời của bạn"
                  className="w-full border-b-2 border-gray-300 pb-1 pt-1 text-sm focus:border-[#673ab7] focus:outline-none bg-transparent transition-colors"
                />
                {errors.fullName && <p className="mt-2 text-xs text-red-600">{errors.fullName}</p>}
              </div>

              {/* Card 3: Email */}
              <div
                onClick={() => setActiveCard("email")}
                className={`rounded-xl border bg-white p-6 shadow-sm transition-all ${
                  activeCard === "email" ? "border-l-4 border-l-[#673ab7] border-gray-300" : "border-gray-200"
                }`}
              >
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  2. Địa chỉ Email chính thức <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">Vé mời QR và thư xác nhận chỗ ngồi sẽ được gửi về email này.</p>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@company.com"
                  className="w-full border-b-2 border-gray-300 pb-1 pt-1 text-sm focus:border-[#673ab7] focus:outline-none bg-transparent transition-colors"
                />
                {errors.email && <p className="mt-2 text-xs text-red-600">{errors.email}</p>}
              </div>

              {/* Card 4: Số điện thoại */}
              <div
                onClick={() => setActiveCard("phone")}
                className={`rounded-xl border bg-white p-6 shadow-sm transition-all ${
                  activeCard === "phone" ? "border-l-4 border-l-[#673ab7] border-gray-300" : "border-gray-200"
                }`}
              >
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  3. Số điện thoại liên hệ (Zalo) <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">Để Ban Thư Ký hỗ trợ kết nối và đón tiếp chu đáo.</p>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0983xxxxxx"
                  className="w-full border-b-2 border-gray-300 pb-1 pt-1 text-sm focus:border-[#673ab7] focus:outline-none bg-transparent transition-colors"
                />
                {errors.phone && <p className="mt-2 text-xs text-red-600">{errors.phone}</p>}
              </div>

              {/* Card 5: Công ty & Chức vụ */}
              <div
                onClick={() => setActiveCard("company")}
                className={`rounded-xl border bg-white p-6 shadow-sm transition-all ${
                  activeCard === "company" ? "border-l-4 border-l-[#673ab7] border-gray-300" : "border-gray-200"
                }`}
              >
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  4. Tên Doanh nghiệp & Chức vụ đại diện <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Tên Doanh nghiệp:</span>
                    <input
                      type="text"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      placeholder="Công ty CP / TNHH..."
                      className="w-full border-b-2 border-gray-300 pb-1 pt-1 text-sm focus:border-[#673ab7] focus:outline-none bg-transparent transition-colors"
                    />
                    {errors.company && <p className="mt-1 text-xs text-red-600">{errors.company}</p>}
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Chức vụ:</span>
                    <input
                      type="text"
                      value={form.jobTitle}
                      onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                      placeholder="Chủ tịch, Tổng Giám Đốc..."
                      className="w-full border-b-2 border-gray-300 pb-1 pt-1 text-sm focus:border-[#673ab7] focus:outline-none bg-transparent transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Card 6: Vai trò tham dự */}
              <div
                onClick={() => setActiveCard("role")}
                className={`rounded-xl border bg-white p-6 shadow-sm transition-all ${
                  activeCard === "role" ? "border-l-4 border-l-[#673ab7] border-gray-300" : "border-gray-200"
                }`}
              >
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  5. Vai trò tham dự của Quý vị <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2.5">
                  {[
                    "Hội viên chính thức (Official Member)",
                    "Khách mời VIP / Diễn giả (VIP Speaker)",
                    "Đại diện Nhà tài trợ (Sponsor Delegate)",
                    "Doanh nhân tìm hiểu gia nhập Hiệp hội",
                  ].map((r) => (
                    <label key={r} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        checked={form.role === r}
                        onChange={() => setForm({ ...form, role: r })}
                        className="h-4 w-4 text-[#673ab7] focus:ring-[#673ab7]"
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Card 7: Nhu cầu B2B Matching */}
              <div
                onClick={() => setActiveCard("b2bNeeds")}
                className={`rounded-xl border bg-white p-6 shadow-sm transition-all ${
                  activeCard === "b2bNeeds" ? "border-l-4 border-l-[#673ab7] border-gray-300" : "border-gray-200"
                }`}
              >
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  6. Nhu cầu kết nối giao thương B2B (Matchmaking)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Quý vị muốn tìm kiếm đối tác trong ngành nghề nào? Sản phẩm / dịch vụ cần mở rộng thị trường?
                </p>
                <textarea
                  rows={3}
                  value={form.b2bNeeds}
                  onChange={(e) => setForm({ ...form, b2bNeeds: e.target.value })}
                  placeholder="Mô tả cụ thể nhu cầu kết nối của doanh nghiệp..."
                  className="w-full border rounded-lg p-3 text-sm border-gray-300 focus:border-[#673ab7] focus:outline-none transition-colors"
                />
              </div>

              {/* Card 8: Câu hỏi cho diễn giả */}
              <div
                onClick={() => setActiveCard("speakerQuestions")}
                className={`rounded-xl border bg-white p-6 shadow-sm transition-all ${
                  activeCard === "speakerQuestions" ? "border-l-4 border-l-[#673ab7] border-gray-300" : "border-gray-200"
                }`}
              >
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  7. Câu hỏi hoặc vấn đề gửi đến Diễn giả / Ban tổ chức
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Câu hỏi sẽ được chuyển trực tiếp tới Ban cố vấn để giải đáp tại phiên Tọa đàm.
                </p>
                <textarea
                  rows={2}
                  value={form.speakerQuestions}
                  onChange={(e) => setForm({ ...form, speakerQuestions: e.target.value })}
                  placeholder="Nhập câu hỏi tại đây..."
                  className="w-full border rounded-lg p-3 text-sm border-gray-300 focus:border-[#673ab7] focus:outline-none transition-colors"
                />
              </div>

              {/* Card 9: Bàn tiệc Gala & Chế độ ăn */}
              <div
                onClick={() => setActiveCard("banquetChoice")}
                className={`rounded-xl border bg-white p-6 shadow-sm transition-all ${
                  activeCard === "banquetChoice" ? "border-l-4 border-l-[#673ab7] border-gray-300" : "border-gray-200"
                }`}
              >
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  8. Đăng ký vị trí Bàn tiệc Gala & Khẩu phần ăn
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Ban tổ chức bố trí bàn tiệc theo chuyên đề để quý hội viên dễ dàng giao lưu cùng đối tác tiềm năng.
                </p>
                <div className="space-y-3 mt-2">
                  <div>
                    <span className="text-xs font-semibold text-gray-700 block mb-1">Loại bàn tiệc ưu tiên:</span>
                    <select
                      value={form.banquetChoice}
                      onChange={(e) => setForm({ ...form, banquetChoice: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:border-[#673ab7] focus:outline-none"
                    >
                      <option value="Bàn Tiệc VIP Gala 01 (Chủ tịch & Ban Cố Vấn)">Bàn Tiệc VIP Gala 01 (Chủ tịch & Ban Cố Vấn)</option>
                      <option value="Bàn Tiệc VIP Gala 02 (Bàn Tròn 10 Chỗ)">Bàn Tiệc VIP Gala 02 (Bàn Tròn 10 Chỗ)</option>
                      <option value="Bàn Tiệc Ban Tài Chính & Bất Động Sản (T1 - 10 Chỗ)">Bàn Tiệc Ban Tài Chính & Bất Động Sản (T1 - 10 Chỗ)</option>
                      <option value="Bàn Tiệc Ban Công Nghệ & Chuyển Đổi Số (T2 - 10 Chỗ)">Bàn Tiệc Ban Công Nghệ & Chuyển Đổi Số (T2 - 10 Chỗ)</option>
                      <option value="Bàn Tiệc Ban Sản Xuất & Xuất Nhập Khẩu (T3 - 10 Chỗ)">Bàn Tiệc Ban Sản Xuất & Xuất Nhập Khẩu (T3 - 10 Chỗ)</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-700 block mb-1">Chế độ ẩm thực:</span>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-700 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="dietary"
                          checked={form.dietaryChoice === "Tiệc mặn cao cấp (Standard Fine Dining)"}
                          onChange={() => setForm({ ...form, dietaryChoice: "Tiệc mặn cao cấp (Standard Fine Dining)" })}
                          className="h-4 w-4 text-[#673ab7]"
                        />
                        <span>Tiệc mặn tiêu chuẩn</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="dietary"
                          checked={form.dietaryChoice === "Tiệc chay dưỡng sinh (Vegetarian)"}
                          onChange={() => setForm({ ...form, dietaryChoice: "Tiệc chay dưỡng sinh (Vegetarian)" })}
                          className="h-4 w-4 text-[#673ab7]"
                        />
                        <span>Tiệc chay thanh đạm</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 10: Tệp hồ sơ doanh nghiệp */}
              <div
                onClick={() => setActiveCard("attachment")}
                className={`rounded-xl border bg-white p-6 shadow-sm transition-all ${
                  activeCard === "attachment" ? "border-l-4 border-l-[#673ab7] border-gray-300" : "border-gray-200"
                }`}
              >
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  9. Tệp đính kèm: Hồ sơ Năng lực / Profile Doanh nghiệp
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Đính kèm link Google Drive, Dropbox hoặc file PDF giới thiệu năng lực để in catalogue sự kiện.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={form.attachmentUrl}
                    onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
                    placeholder="https://drive.google.com/..."
                    className="flex-1 border rounded-lg p-2.5 text-sm border-gray-300 focus:border-[#673ab7] focus:outline-none"
                  />
                  <div className="flex items-center gap-1 bg-gray-100 px-3 py-2.5 rounded-lg text-xs text-gray-600 border border-gray-200 shrink-0">
                    <Upload className="h-3.5 w-3.5" /> PDF / Link
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="flex items-center justify-between pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#673ab7] px-8 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#5e35b1] active:scale-[0.99] transition disabled:opacity-50"
                >
                  {submitting ? "Đang ghi nhận..." : "Gửi phiếu đăng ký"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm({
                      fullName: "",
                      email: "",
                      phone: "",
                      company: "",
                      jobTitle: "",
                      industry: "",
                      role: "Hội viên chính thức (Official Member)",
                      b2bNeeds: "",
                      speakerQuestions: "",
                      banquetChoice: "Bàn Tiệc VIP Gala 01 (Chủ tịch & Ban Cố Vấn)",
                      dietaryChoice: "Tiệc mặn cao cấp (Standard Fine Dining)",
                      attachmentUrl: "",
                    });
                  }}
                  className="text-xs text-gray-500 hover:text-gray-800 transition"
                >
                  Xóa hết câu trả lời
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
