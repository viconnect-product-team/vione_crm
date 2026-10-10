import { useState } from "react";
import { Ticket, Clock, MapPin, QrCode, X } from "lucide-react";
import { type ActionTicketData } from "./types";

export function EventTicketCard({ data, isFromMe }: { data: ActionTicketData; isFromMe: boolean }) {
  const [showQrModal, setShowQrModal] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-slate-900 via-[#002244] to-slate-950 text-white shadow-xl max-w-sm">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 px-4 py-2.5 text-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-black text-xs tracking-wider uppercase">
          <Ticket className="h-4 w-4" />
          <span>VÉ ĐIỆN TỬ VIP</span>
        </div>
        <span className="rounded-full bg-slate-950/20 px-2 py-0.5 text-[10px] font-bold">
          {data.ticketType || "Miễn phí"}
        </span>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-3.5">
        <div>
          <p className="text-[10px] font-semibold text-amber-400 tracking-wider uppercase">
            CLB DOANH NHÂN ViOne Connect
          </p>
          <h4 className="text-[14px] font-bold text-white leading-snug mt-0.5 line-clamp-2">
            {data.eventTitle}
          </h4>
        </div>

        {/* Info Grid */}
        <div className="space-y-2 rounded-xl bg-white/5 p-3 text-[11.5px] border border-white/10 backdrop-blur-sm">
          {data.attendee && (
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="text-slate-400">Người tham dự:</span>
              <span className="font-bold text-white">{data.attendee}</span>
            </div>
          )}
          {data.time && (
            <div className="flex items-center gap-2 text-slate-200">
              <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>{data.time}</span>
            </div>
          )}
          {data.location && (
            <div className="flex items-center gap-2 text-slate-200">
              <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
              <span className="line-clamp-1">{data.location}</span>
            </div>
          )}
          {data.luckyNumber && (
            <div className="flex items-center justify-between pt-1 border-t border-white/10">
              <span className="text-amber-300/80 font-medium">Mã số may mắn (Lucky Draw):</span>
              <span className="font-black text-amber-400 text-sm tracking-wider">#{data.luckyNumber}</span>
            </div>
          )}
        </div>

        {/* QR Code Section */}
        {data.qrUrl && (
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white text-slate-950 shadow-inner">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <QrCode className="h-3 w-3 text-slate-700" />
              MÃ CHECK-IN TẠI SỰ KIỆN
            </div>
            <img
              src={data.qrUrl}
              alt="QR Check-in"
              className="h-36 w-36 object-contain rounded-lg border border-slate-200 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setShowQrModal(true)}
            />
            <div className="mt-1.5 font-mono text-xs font-black tracking-widest text-slate-800">
              {data.ticketCode}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {data.qrUrl && (
            <button
              onClick={() => setShowQrModal(true)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 text-xs transition cursor-pointer shadow"
            >
              <QrCode className="h-3.5 w-3.5" />
              Phóng to mã QR
            </button>
          )}
          <a
            href="/association/events"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-3 text-xs border border-white/15 transition"
          >
            Chi tiết
          </a>
        </div>
      </div>

      {/* QR Modal preview */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="relative bg-white text-slate-950 rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="font-bold text-sm text-slate-900 mb-1">{data.eventTitle}</div>
            <div className="text-xs text-slate-500 mb-4">Mã vé: {data.ticketCode}</div>
            <img src={data.qrUrl} alt="QR Code" className="w-56 h-56 mx-auto object-contain rounded-xl border border-slate-200 shadow-sm" />
            <p className="mt-4 text-xs text-slate-600 font-medium">
              Vui lòng xuất trình mã này tại quầy check-in sự kiện
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
