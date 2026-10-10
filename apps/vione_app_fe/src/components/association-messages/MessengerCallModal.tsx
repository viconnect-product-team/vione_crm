import React, { useState, useEffect } from "react";
import { ShieldCheck, X, MicOff, Mic, Video, Volume2, PhoneOff } from "lucide-react";
import { toast } from "sonner";
import { resolveMediaUrl, initialsOf } from "./types";

export interface MessengerCallModalProps {
  type: "audio" | "video";
  peerName: string;
  peerAvatar?: string | null;
  onClose: () => void;
  onEndCall?: (result: { type: "audio" | "video"; duration: number; status: "completed" | "missed" }) => void;
}

export function MessengerCallModal({
  type,
  peerName,
  peerAvatar,
  onClose,
  onEndCall,
}: MessengerCallModalProps) {
  const [callStatus, setCallStatus] = useState<"ringing" | "connected">("ringing");
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    const ringTimer = setTimeout(() => {
      setCallStatus("connected");
    }, 2000);
    return () => clearTimeout(ringTimer);
  }, []);

  useEffect(() => {
    if (callStatus !== "connected") return;
    const interval = setInterval(() => {
      setCallSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  const fmtDuration = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleEndCall = () => {
    const isConnected = callStatus === "connected" && callSeconds > 0;
    const duration = isConnected ? callSeconds : 0;
    const status = isConnected ? "completed" : "missed";
    toast.info(isConnected ? `Cuộc gọi kết thúc (${fmtDuration(duration)})` : "Cuộc gọi đã kết thúc");
    if (onEndCall) {
      onEndCall({ type, duration, status });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-slate-950 via-slate-900 to-black p-6 text-white backdrop-blur-2xl animate-fade-in select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pt-6 text-slate-300">
        <span className="text-[12px] font-semibold tracking-wide uppercase flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
          {type === "video" ? "Cuộc gọi Video mã hóa E2E" : "Cuộc gọi Thoại mã hóa E2E"}
        </span>
        <button
          onClick={handleEndCall}
          className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Avatar & Caller Info */}
      <div className="flex flex-col items-center justify-center my-auto space-y-5">
        <div className="relative">
          {/* Concentric wave rings when ringing */}
          {callStatus === "ringing" && (
            <>
              <div className="absolute -inset-4 rounded-full bg-blue-500/20 animate-ping opacity-60" />
              <div className="absolute -inset-8 rounded-full bg-blue-500/10 animate-pulse opacity-40" />
            </>
          )}

          {peerAvatar ? (
            <img
              src={resolveMediaUrl(peerAvatar) || peerAvatar}
              alt={peerName}
              className="relative h-28 w-28 rounded-full object-cover ring-4 ring-blue-500/50 shadow-2xl"
            />
          ) : (
            <div className="relative grid h-28 w-28 place-items-center rounded-full bg-blue-600/30 text-blue-300 ring-4 ring-blue-500/50 text-3xl font-black shadow-2xl">
              {initialsOf(peerName)}
            </div>
          )}
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-white drop-shadow-md">{peerName}</h2>
          <p className="text-sm font-medium text-slate-400">
            {callStatus === "ringing" ? "Đang đổ chuông..." : fmtDuration(callSeconds)}
          </p>
        </div>
      </div>

      {/* Call Controls Bar */}
      <div className="w-full max-w-xs flex items-center justify-around pb-8">
        <button
          type="button"
          onClick={() => setIsMuted((m) => !m)}
          className={`flex flex-col items-center gap-1.5 transition active:scale-90 cursor-pointer ${
            isMuted ? "text-rose-400" : "text-white"
          }`}
        >
          <div
            className={`grid h-13 w-13 place-items-center rounded-full border ${
              isMuted
                ? "bg-rose-500/20 border-rose-500"
                : "bg-white/10 border-white/15 hover:bg-white/20"
            }`}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </div>
          <span className="text-[11px] font-medium">{isMuted ? "Đã tắt mic" : "Tắt mic"}</span>
        </button>

        {type === "video" && (
          <button
            type="button"
            onClick={() => setIsVideoOff((v) => !v)}
            className={`flex flex-col items-center gap-1.5 transition active:scale-90 cursor-pointer ${
              isVideoOff ? "text-rose-400" : "text-white"
            }`}
          >
            <div
              className={`grid h-13 w-13 place-items-center rounded-full border ${
                isVideoOff
                  ? "bg-rose-500/20 border-rose-500"
                  : "bg-white/10 border-white/15 hover:bg-white/20"
              }`}
            >
              <Video className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-medium">{isVideoOff ? "Bật cam" : "Tắt cam"}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsSpeaker((s) => !s)}
          className={`flex flex-col items-center gap-1.5 transition active:scale-90 cursor-pointer ${
            isSpeaker ? "text-blue-400" : "text-white"
          }`}
        >
          <div
            className={`grid h-13 w-13 place-items-center rounded-full border ${
              isSpeaker
                ? "bg-blue-500/20 border-blue-500"
                : "bg-white/10 border-white/15 hover:bg-white/20"
            }`}
          >
            <Volume2 className="h-6 w-6" />
          </div>
          <span className="text-[11px] font-medium">Loa ngoài</span>
        </button>

        {/* End Call Button */}
        <button
          type="button"
          onClick={handleEndCall}
          className="flex flex-col items-center gap-1.5 transition active:scale-90 cursor-pointer text-white"
        >
          <div className="grid h-14 w-14 place-items-center rounded-full bg-rose-600 hover:bg-rose-700 shadow-[0_0_20px_rgba(244,63,94,0.6)]">
            <PhoneOff className="h-6 w-6 text-white" />
          </div>
          <span className="text-[11px] font-medium text-rose-300">Kết thúc</span>
        </button>
      </div>
    </div>
  );
}
