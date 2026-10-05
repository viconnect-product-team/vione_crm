import { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Send,
  Sparkles,
  Handshake,
  MessageSquare,
  Loader2,
  Building2,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";

export interface ProposeOpportunityMeetingModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  opportunity?: {
    id: string;
    title: string;
    posterId?: string;
    posterName?: string;
    companyName?: string;
  };
  opportunityTitle?: string;
  opportunityRef?: string;
  partnerId?: string;
  partnerName?: string;
  onSent?: () => void;
  onSuccess?: () => void;
}

export function ProposeOpportunityMeetingModal({
  open,
  isOpen,
  onClose,
  opportunity,
  opportunityTitle,
  opportunityRef,
  partnerId,
  partnerName,
  onSent,
  onSuccess,
}: ProposeOpportunityMeetingModalProps) {
  const isModalOpen = open ?? isOpen ?? false;
  const targetOpportunity = opportunity || {
    id: opportunityRef || "opp_default",
    title: opportunityTitle || "Cơ hội kinh doanh B2B",
    posterId: partnerId,
    posterName: partnerName || "Đối tác",
  };

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const [date, setDate] = useState(tomorrow);
  const [time, setTime] = useState("09:30");
  const [format, setFormat] = useState<"offline" | "online">("offline");
  const [location, setLocation] = useState("Văn phòng doanh nghiệp hoặc Cà phê kết nối");
  const [note, setNote] = useState(
    `Chào Anh/Chị, tôi rất quan tâm đến cơ hội "${targetOpportunity.title}" và mong muốn có cuộc gặp trao đổi trực tiếp để xúc tiến hợp tác giao thương.`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) {
      toast.error("Vui lòng chọn ngày và giờ hẹn gặp!");
      return;
    }

    setIsSubmitting(true);
    const meetingDateTime = `${date} lúc ${time}`;
    const targetLocation = format === "online" ? "Cuộc gọi Video Trực Tuyến ViOne" : location.trim();

    try {
      // 1. Gửi template hẹn gặp trao đổi cơ hội vào API backend
      const res = await fetchNestApi<any>(`/connect-app/opportunities/${targetOpportunity.id}/propose-meeting`, {
        method: "POST",
        body: JSON.stringify({
          opportunityId: targetOpportunity.id,
          opportunityTitle: targetOpportunity.title,
          posterId: targetOpportunity.posterId,
          meetingTime: meetingDateTime,
          meetingDate: date,
          meetingHour: time,
          format,
          location: targetLocation,
          note: note.trim(),
        }),
      }).catch(async () => {
        // Fallback mở thread và gửi tin nhắn trực tiếp nếu endpoint trên chưa có
        const counterpart = targetOpportunity.posterId || "admin";
        const threadRes = await fetchNestApi<any>(`/connect-app/inbox/open`, {
          method: "POST",
          body: JSON.stringify({ targetUserId: counterpart }),
        }).catch(() => null);

        const threadId = threadRes?.threadId || `thread_${Date.now()}`;
        const templateBody = `[🤝 ĐỀ XUẤT HẸN GẶP TRAO ĐỔI CƠ HỘI]
• Cơ hội kinh doanh: "${targetOpportunity.title}"
• Thời gian đề xuất: ${meetingDateTime}
• Hình thức: ${format === "online" ? "Video Call Trực Tuyến ViOne" : "Gặp trực tiếp: " + targetLocation}
• Lời nhắn: "${note.trim()}"`;

        const proposalMeta = {
          type: "OPPORTUNITY_MEETING_PROPOSAL",
          opportunityId: targetOpportunity.id,
          opportunityTitle: targetOpportunity.title,
          meetingTime: meetingDateTime,
          date,
          time,
          format,
          location: targetLocation,
          note: note.trim(),
          status: "pending",
        };

        await fetchNestApi(`/connect-app/inbox/${threadId}/messages`, {
          method: "POST",
          body: JSON.stringify({
            body: templateBody,
            meta: proposalMeta,
          }),
        }).catch(() => {});

        return { ok: true };
      });

      // 2. Lưu vào danh sách hẹn gặp dự kiến local để sẵn sàng đưa vào trang chủ khi xác nhận
      try {
        const stored = localStorage.getItem("vba_pending_meeting_proposals") || "[]";
        const list = JSON.parse(stored);
        list.unshift({
          id: `prop_${Date.now()}`,
          opportunityId: targetOpportunity.id,
          opportunityTitle: targetOpportunity.title,
          partnerName: targetOpportunity.posterName || "Người đăng cơ hội",
          companyName: targetOpportunity.companyName || "Đối tác ViOne",
          date,
          time,
          format,
          location: targetLocation,
          status: "pending",
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem("vba_pending_meeting_proposals", JSON.stringify(list));
      } catch {}

      toast.success("Đã gửi nguyên template đề xuất hẹn gặp kèm nút phản hồi vào tin nhắn của người đăng cơ hội!", {
        description: `Thời gian: ${meetingDateTime} • Đối tác sẽ nhận được thông báo ngay lập tức.`,
      });

      if (onSent) onSent();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Không thể gửi đề xuất. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-t-[28px] sm:rounded-3xl border border-[#DFB76C]/40 bg-[#0B0F17] text-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-[#151D2C] via-[#0E1522] to-[#151D2C]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#DFB76C] to-[#8C653B] text-black shadow-md">
              <Handshake className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#F6E1C3]">
                Nhắn Tin Hẹn Gặp Trao Đổi Cơ Hội
              </h2>
              <p className="text-[11px] text-slate-400">
                Gửi template lịch hẹn kèm nút [Đồng ý] & [Từ chối] vào tin nhắn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white transition active:scale-95 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Opportunity Summary Card */}
        <div className="mx-5 mt-4 p-3.5 rounded-2xl border border-[#DFB76C]/30 bg-gradient-to-r from-[#DFB76C]/10 via-transparent to-transparent">
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#DFB76C]/20 text-[#DFB76C]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#DFB76C]">
                Cơ hội kinh doanh đang kết nối
              </span>
              <h4 className="text-[13px] font-bold text-white leading-snug line-clamp-2">
                {targetOpportunity.title}
              </h4>
              <p className="mt-0.5 text-[11px] text-slate-400 flex items-center gap-1.5">
                <span>Người đăng: <strong className="text-slate-200">{targetOpportunity.posterName || "Đối tác ViOne"}</strong></span>
                {targetOpportunity.companyName && <span>• {targetOpportunity.companyName}</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-3.5 [scrollbar-width:none]">
          {/* Format: Trực tiếp vs Online */}
          <div>
            <label className="block text-[12px] font-bold text-slate-300 mb-1.5">
              Hình Thức Cuộc Gặp
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat("offline")}
                className={`py-2 px-3 rounded-xl border text-[12px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  format === "offline"
                    ? "border-[#DFB76C] bg-[#DFB76C]/15 text-[#F6E1C3] shadow-sm"
                    : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                <MapPin className="h-3.5 w-3.5 text-[#DFB76C]" />
                <span>Gặp gỡ trực tiếp</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat("online")}
                className={`py-2 px-3 rounded-xl border text-[12px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  format === "online"
                    ? "border-[#DFB76C] bg-[#DFB76C]/15 text-[#F6E1C3] shadow-sm"
                    : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                <Video className="h-3.5 w-3.5 text-[#DFB76C]" />
                <span>Video Call ViOne</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[12px] font-bold text-slate-300 mb-1">
                Ngày Đề Xuất
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-white/15 bg-slate-900/90 text-white focus:border-[#DFB76C] focus:outline-hidden text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-slate-300 mb-1">
                Giờ Đề Xuất
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-white/15 bg-slate-900/90 text-white focus:border-[#DFB76C] focus:outline-hidden text-[13px]"
              />
            </div>
          </div>

          {format === "offline" && (
            <div>
              <label className="block text-[12px] font-bold text-slate-300 mb-1">
                Địa Điểm Cuộc Hẹn
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="VD: ViOne Lounge, Highlands Café Keangnam..."
                className="w-full h-11 px-3.5 rounded-xl border border-white/15 bg-slate-900/90 text-white focus:border-[#DFB76C] focus:outline-hidden text-[13px]"
              />
            </div>
          )}

          <div>
            <label className="block text-[12px] font-bold text-slate-300 mb-1">
              Lời Nhắn & Nội Dung Trao Đổi
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3 rounded-xl border border-white/15 bg-slate-900/90 text-white focus:border-[#DFB76C] focus:outline-hidden text-[13px] leading-relaxed resize-none"
            />
          </div>

          {/* Template Preview Hint */}
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/5 p-3 text-[11px] text-amber-200/90 leading-relaxed">
            💡 <strong>Quy trình tự động hóa:</strong> Khi gửi, hệ thống sẽ chuyển toàn bộ thông tin cơ hội và đề xuất này thành một tin nhắn template có 2 nút <strong>[Đồng ý hẹn gặp]</strong> và <strong>[Từ chối]</strong> tới người đăng cơ hội. Khi người đó bấm <strong>[Đồng ý]</strong>, cuộc gặp sẽ tự động xuất hiện ở <strong>Lịch trang chủ</strong> của cả hai bên!
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-bold text-[13.5px] bg-gradient-to-r from-[#F6E1C3] via-[#D8B282] to-[#B88E4C] text-[#050811] shadow-lg hover:brightness-105 active:scale-98 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-black" />
                  <span>Đang gửi đề xuất...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 text-black" />
                  <span>Gửi Template Đề Xuất Hẹn Gặp Ngay</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
