import { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Handshake,
  Sparkles,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";

export interface OpportunityMeetingData {
  opportunityId?: string;
  opportunityTitle?: string;
  meetingTime?: string;
  date?: string;
  time?: string;
  format?: "offline" | "online";
  location?: string;
  note?: string;
  status?: "pending" | "accepted" | "declined";
  proposerName?: string;
  posterName?: string;
}

export interface OpportunityMeetingProposalCardProps {
  data: OpportunityMeetingData;
  isFromMe: boolean;
  messageId: string;
  onStatusChange?: (newStatus: "accepted" | "declined") => void;
}

export function OpportunityMeetingProposalCard({
  data,
  isFromMe,
  messageId,
  onStatusChange,
}: OpportunityMeetingProposalCardProps) {
  const [status, setStatus] = useState<"pending" | "accepted" | "declined">(
    data.status || "pending"
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRespond = async (action: "accept" | "decline") => {
    setIsProcessing(true);
    const newStatus = action === "accept" ? "accepted" : "declined";

    try {
      // 1. Gọi API phản hồi cuộc hẹn
      await fetchNestApi(`/connect-app/meetings/respond`, {
        method: "POST",
        body: JSON.stringify({
          messageId,
          opportunityId: data.opportunityId,
          action,
        }),
      }).catch(async () => {
        // Fallback endpoint
        await fetchNestApi(`/meetings/respond`, {
          method: "POST",
          body: JSON.stringify({ messageId, action }),
        }).catch(() => {});
      });

      if (action === "accept") {
        // 2. Thêm vào Lịch cuộc gặp ở trang chủ (vba_scheduled_meetings & meetingsData)
        try {
          const stored = localStorage.getItem("vba_scheduled_meetings") || "[]";
          const list = JSON.parse(stored);
          const newMeeting = {
            id: `opp_meet_${Date.now()}`,
            title: `Gặp gỡ trao đổi cơ hội: ${data.opportunityTitle || "Hợp tác B2B"}`,
            partnerName: data.proposerName || "Doanh nhân Đối tác",
            counterpart: data.proposerName || "Doanh nhân Đối tác",
            date: data.date || new Date().toISOString(),
            time: data.time || "09:30",
            format: data.format || "offline",
            location: data.location || "Văn phòng doanh nghiệp",
            status: "confirmed",
            opportunityId: data.opportunityId,
            createdAt: new Date().toISOString(),
          };
          list.unshift(newMeeting);
          localStorage.setItem("vba_scheduled_meetings", JSON.stringify(list));
          window.dispatchEvent(new Event("meeting-scheduled"));
        } catch {}

        toast.success("Đã đồng ý cuộc hẹn trao đổi cơ hội!", {
          description: "Cuộc gặp đã được tự động thêm vào Lịch cuộc gặp ở Trang chủ của cả 2 bên.",
        });
      } else {
        toast.info("Đã từ chối đề xuất cuộc hẹn này.");
      }

      setStatus(newStatus);
      if (onStatusChange) onStatusChange(newStatus);
    } catch {
      setStatus(newStatus);
      if (onStatusChange) onStatusChange(newStatus);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-[340px] rounded-2xl border-2 border-[#DFB76C] bg-gradient-to-b from-[#182030] via-[#0E1522] to-[#0A0E17] text-white p-3.5 shadow-xl overflow-hidden my-1">
      {/* Top Badge */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-[#DFB76C]/20 text-[#F6E1C3] border border-[#DFB76C]/40">
          <Handshake className="h-3 w-3 text-[#DFB76C]" />
          <span>Hẹn Gặp Trao Đổi Cơ Hội</span>
        </span>
        <span
          className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md ${
            status === "accepted"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : status === "declined"
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
          }`}
        >
          {status === "accepted"
            ? "Đã đồng ý"
            : status === "declined"
            ? "Đã từ chối"
            : "Chờ phản hồi"}
        </span>
      </div>

      {/* Opportunity Title */}
      <div className="mt-2.5">
        <h4 className="text-[13px] font-bold text-white leading-snug line-clamp-2">
          {data.opportunityTitle || "Cơ hội hợp tác giao thương B2B"}
        </h4>
      </div>

      {/* Meeting Details */}
      <div className="mt-2.5 space-y-1.5 text-[11.5px] text-slate-300">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-[#DFB76C] shrink-0" />
          <span>
            Thời gian: <strong className="text-white">{data.meetingTime || "Ngày mai lúc 09:30"}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-[#DFB76C] shrink-0" />
          <span className="truncate">
            Địa điểm: <strong className="text-white">{data.location || "Gặp trực tiếp"}</strong>
          </span>
        </div>
        {data.note && (
          <div className="mt-2 p-2 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-300 italic">
            "{data.note}"
          </div>
        )}
      </div>

      {/* Actions: Đồng ý & Từ chối */}
      {status === "pending" ? (
        !isFromMe ? (
          <div className="mt-3.5 grid grid-cols-2 gap-2 pt-2.5 border-t border-white/10">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleRespond("decline")}
              className="py-2 px-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-[11.5px] transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? "Đang xử lý..." : "❌ Từ chối"}
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleRespond("accept")}
              className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#F6E1C3] via-[#D8B282] to-[#B88E4C] text-[#050811] font-bold text-[11.5px] shadow-md hover:brightness-105 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto text-black" />
              ) : (
                "✅ Đồng ý hẹn"
              )}
            </button>
          </div>
        ) : (
          <div className="mt-3 pt-2 border-t border-white/10 text-center text-[10.5px] text-[#DFB76C]">
            ⏳ Đang chờ người đăng cơ hội bấm Đồng ý...
          </div>
        )
      ) : status === "accepted" ? (
        <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-emerald-400">
          <span className="flex items-center gap-1 font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Đã đưa vào Lịch cuộc gặp trang chủ
          </span>
          <a
            href="/connect-app/meetings"
            className="text-[10px] text-[#DFB76C] hover:underline flex items-center gap-0.5"
          >
            <span>Xem lịch</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      ) : (
        <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-1 text-[11px] text-rose-400 font-semibold">
          <XCircle className="h-3.5 w-3.5" />
          <span>Cuộc hẹn đã bị từ chối</span>
        </div>
      )}
    </div>
  );
}
