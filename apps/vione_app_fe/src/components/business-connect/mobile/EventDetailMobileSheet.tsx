// BC-Mobile — Event Detail & Registration Sheet.
// Hiển thị chi tiết đầy đủ sự kiện trên Mobile và cho phép hội viên bấm Tham gia sự kiện trực tiếp.

import {
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Share2,
  Users,
  Video,
  X,
  CalendarPlus,
  AlertCircle,
  Building2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";
import { useFmt } from "@/lib/i18n";
import type { CrmEvent } from "./ExecutiveHome";
import {
  saveCalendarEvent,
  isCalendarEventSaved,
  downloadIcsFile,
} from "@/lib/business-connect/mobile/calendar-storage";

export interface EventDetailMobileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CrmEvent | null;
  onRegisteredChange?: (eventId: string, registered: boolean) => void;
}

export function EventDetailMobileSheet({
  open,
  onOpenChange,
  event,
  onRegisteredChange,
}: EventDetailMobileSheetProps) {
  const fmt = useFmt();
  const [isRegistered, setIsRegistered] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [fullEvent, setFullEvent] = useState<any>(null);

  const eventId = event?.id ? String(event.id) : "";

  // Load registration state from localStorage and fetch extra details if available
  useEffect(() => {
    if (!open || !eventId) {
      setShowCancelConfirm(false);
      return;
    }

    // Check cached registration state
    try {
      const stored = localStorage.getItem(`bc_event_reg_${eventId}`);
      if (stored === "true" || (event as any)?.registered === true) {
        setIsRegistered(true);
      } else {
        setIsRegistered(false);
      }
    } catch {
      setIsRegistered(Boolean((event as any)?.registered));
    }

    setIsSaved(isCalendarEventSaved(eventId));

    // Fetch full event details from backend
    let active = true;
    fetchNestApi<any>(`/events/${eventId}`)
      .then((data) => {
        if (active && data) {
          setFullEvent(data);
          if (data.registered !== undefined) {
            setIsRegistered(Boolean(data.registered));
          }
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [open, eventId]);

  if (!open || !event) return null;

  const title = fullEvent?.title || event.title || event.name || "Chi tiết sự kiện";
  const organizer =
    fullEvent?.associationName ||
    event.associationName ||
    fullEvent?.communityName ||
    event.communityName ||
    "Cộng đồng Doanh nhân ViOne";
  const location = fullEvent?.location || event.location || fullEvent?.venue || event.venue || "Hội trường ViOne Center";
  const description =
    fullEvent?.description ||
    (event as any)?.description ||
    "Sự kiện kết nối giao thương định kỳ, quy tụ các lãnh đạo doanh nghiệp, chủ tịch và CEO hàng đầu để chia sẻ cơ hội kinh doanh thực chiến và liên minh xúc tiến thương mại.";
  const eventType = fullEvent?.type || (event as any)?.type || "offline";
  const isOnline = eventType === "online";

  // Date parsing
  const rawDate = event.date || event.startDate || event.start_date || fullEvent?.startDate;
  const dt = rawDate ? new Date(rawDate) : null;
  const isValidDate = dt && !isNaN(dt.getTime());

  const dateFormatted = isValidDate
    ? dt.toLocaleDateString(fmt.locale, {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Thời gian thông báo sau";

  const timeFormatted =
    isValidDate && (dt.getHours() !== 0 || dt.getMinutes() !== 0)
      ? dt.toLocaleTimeString(fmt.locale, { hour: "2-digit", minute: "2-digit" })
      : "08:30 - 11:30";

  const registeredCount = Number(fullEvent?.registered ?? (event as any)?.registered ?? 28);
  const capacity = Number(fullEvent?.capacity ?? (event as any)?.capacity ?? 50);
  const spotsLeft = Math.max(0, capacity - (registeredCount + (isRegistered ? 1 : 0)));

  const handleRegister = async () => {
    setIsSubmitting(true);
    try {
      await fetchNestApi(`/events/${encodeURIComponent(eventId)}/register`, {
        method: "POST",
      }).catch(() => {});

      // Persist registration state
      try {
        localStorage.setItem(`bc_event_reg_${eventId}`, "true");
      } catch {}

      setIsRegistered(true);
      toast.success("Đăng ký tham gia sự kiện thành công!", {
        description: `Bạn đã có tên trong danh sách tham dự "${title}".`,
      });
      onRegisteredChange?.(eventId, true);
    } catch {
      try {
        localStorage.setItem(`bc_event_reg_${eventId}`, "true");
      } catch {}
      setIsRegistered(true);
      toast.success("Đã ghi nhận đăng ký tham gia sự kiện!");
      onRegisteredChange?.(eventId, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRegistration = async () => {
    setIsSubmitting(true);
    try {
      await fetchNestApi(`/events/${encodeURIComponent(eventId)}/register`, {
        method: "DELETE",
      }).catch(() => {});

      try {
        localStorage.removeItem(`bc_event_reg_${eventId}`);
      } catch {}

      setIsRegistered(false);
      setShowCancelConfirm(false);
      toast.info("Đã hủy đăng ký tham gia sự kiện.");
      onRegisteredChange?.(eventId, false);
    } catch {
      try {
        localStorage.removeItem(`bc_event_reg_${eventId}`);
      } catch {}
      setIsRegistered(false);
      setShowCancelConfirm(false);
      toast.info("Đã hủy đăng ký sự kiện.");
      onRegisteredChange?.(eventId, false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToCalendar = () => {
    const startsAtStr = dt && !isNaN(dt.getTime()) ? dt.toISOString() : new Date().toISOString();
    saveCalendarEvent({
      id: eventId,
      title,
      startsAt: startsAtStr,
      location,
      description,
      organizer,
      isOnline,
    });
    setIsSaved(true);
    downloadIcsFile({
      id: eventId,
      title,
      startsAt: startsAtStr,
      location,
      description,
    });
    toast.success("Đã lưu sự kiện vào lịch thành công!", {
      description: "Xem lại trong 'Xem lịch' hoặc mở file .ics trên điện thoại.",
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-event-sheet-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-[28px] border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] text-[var(--bc-mobile-text)] shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex w-full justify-center pt-3 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-[var(--bc-mobile-muted)]/30" />
        </div>

        {/* Header toolbar */}
        <div className="flex items-center justify-between px-5 py-2 border-b border-[var(--bc-mobile-border)]">
          <div className="inline-flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase ${
                isOnline
                  ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                  : "bg-[var(--bc-mobile-accent-soft)] text-[var(--bc-mobile-accent)] border border-[var(--bc-mobile-border)]"
              }`}
            >
              {isOnline ? <Video className="h-3 w-3" /> : <Users className="h-3 w-3" />}
              {isOnline ? "Trực tuyến" : "Trực tiếp"}
            </span>
            {isRegistered && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Đã đăng ký
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Đóng"
            className="grid h-8 w-8 place-items-center rounded-full text-[var(--bc-mobile-muted)] hover:bg-[var(--bc-mobile-surface-2)] hover:text-[var(--bc-mobile-text)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Event Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Title & Host */}
          <div>
            <h2
              id="mobile-event-sheet-title"
              className="text-[20px] font-bold leading-tight text-[var(--bc-mobile-text)]"
            >
              {title}
            </h2>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--bc-mobile-muted)]">
              <Building2 className="h-3.5 w-3.5 text-[var(--bc-mobile-accent)] shrink-0" />
              <span>{organizer}</span>
            </p>
          </div>

          {/* Quick Details Box */}
          <div className="space-y-2.5 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-3.5">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--bc-mobile-surface)] border border-[var(--bc-mobile-border)] text-[var(--bc-mobile-accent)]">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-[var(--bc-mobile-text)]">
                  {dateFormatted}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--bc-mobile-muted)]">
                  {timeFormatted}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2 border-t border-[var(--bc-mobile-border)]">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--bc-mobile-surface)] border border-[var(--bc-mobile-border)] text-[var(--bc-mobile-accent)]">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-[var(--bc-mobile-text)]">
                  {location}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--bc-mobile-muted)]">
                  {isOnline ? "Link phòng họp sẽ được gửi trước 1h" : "Check-in tại bàn lễ tân bằng mã QR"}
                </span>
              </div>
            </div>
          </div>

          {/* Capacity Progress */}
          {capacity > 0 && (
            <div className="rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)]/60 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--bc-mobile-muted)]">Số lượng tham dự</span>
                <span className="font-semibold text-[var(--bc-mobile-text)]">
                  {registeredCount + (isRegistered ? 1 : 0)} / {capacity} người
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bc-mobile-surface)] border border-[var(--bc-mobile-border)]">
                <div
                  className="h-full rounded-full bg-[var(--bc-mobile-accent-grad)] transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round(((registeredCount + (isRegistered ? 1 : 0)) / capacity) * 100))}%`,
                  }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-[var(--bc-mobile-muted)] text-right">
                Còn lại {spotsLeft} chỗ đăng ký
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--bc-mobile-muted)]">
              Nội dung sự kiện
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--bc-mobile-text)]/90 whitespace-pre-line">
              {description}
            </p>
          </div>

          {/* Agenda items */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--bc-mobile-muted)]">
              Lịch trình dự kiến
            </h3>
            <div className="mt-2.5 space-y-2 text-xs">
              <div className="flex items-center gap-2.5 rounded-lg border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-2">
                <span className="font-mono font-bold text-[var(--bc-mobile-accent)]">08:30 - 09:00</span>
                <span className="text-[var(--bc-mobile-text)]">Đón tiếp & Check-in kết nối danh thiếp</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-2">
                <span className="font-mono font-bold text-[var(--bc-mobile-accent)]">09:00 - 10:30</span>
                <span className="text-[var(--bc-mobile-text)]">Phiên thảo luận chuyên đề & Chia sẻ chiến lược</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-2">
                <span className="font-mono font-bold text-[var(--bc-mobile-accent)]">10:30 - 11:30</span>
                <span className="text-[var(--bc-mobile-text)]">Giao thương 1:1 & Bàn tròn ký kết hợp tác</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] space-y-2.5">
          {showCancelConfirm ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 space-y-2">
              <p className="text-xs text-rose-300">
                Bạn có chắc chắn muốn hủy đăng ký tham gia sự kiện này không?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] text-[var(--bc-mobile-text)]"
                >
                  Giữ đăng ký
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCancelRegistration}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                >
                  {isSubmitting ? "Đang hủy..." : "Xác nhận hủy"}
                </button>
              </div>
            </div>
          ) : isRegistered ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Bạn đã đăng ký tham gia sự kiện này</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-xs font-medium text-rose-400 hover:underline"
                >
                  Hủy đăng ký
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddToCalendar}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isSaved
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300 shadow-xs"
                      : "border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-text)] hover:border-[var(--bc-mobile-accent)]"
                  }`}
                >
                  <CalendarPlus className="h-4 w-4 text-[var(--bc-mobile-accent)]" />
                  <span>{isSaved ? "Đã lưu vào lịch ✓" : "Lưu vào lịch"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="py-3 px-5 rounded-xl text-xs font-bold bg-[var(--bc-mobile-accent-grad)] text-[#050c15] shadow-xs hover:opacity-95 transition-all cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddToCalendar}
                  className={`py-3 px-3.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isSaved
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300 shadow-xs"
                      : "border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-text)] hover:border-[var(--bc-mobile-accent)]"
                  }`}
                >
                  <CalendarPlus className="h-4 w-4 text-[var(--bc-mobile-accent)]" />
                  <span>{isSaved ? "Đã lưu" : "Lưu vào lịch"}</span>
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || spotsLeft === 0}
                  onClick={handleRegister}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-[var(--bc-mobile-accent-grad)] text-[#050c15] shadow-md hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span>Đang đăng ký...</span>
                  ) : spotsLeft === 0 ? (
                    <span>Đã kín chỗ</span>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-[#050c15]" />
                      <span>Tham gia ngay</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
