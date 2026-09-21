import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  RefreshCw,
  Sparkles,
  User,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { getConnectAppSocket } from "@/hooks/use-connect-app-socket";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";
import { safeRandomUUID } from "@/lib/utils";
import { getSafeUserMedia, isHttpInsecureContext, getInsecureContextHelp } from "@/lib/call-media";

export interface CallRecordPayload {
  callType: "audio" | "video";
  status: "ended" | "missed" | "declined";
  duration: number;
}

export interface DmCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callType: "audio" | "video";
  callId?: string;
  counterpartUserId?: string;
  counterpartName: string;
  counterpartAvatar?: string | null;
  counterpartTitle?: string | null;
  isIncomingAcceptance?: boolean;
  onCallRecord?: (record: CallRecordPayload) => void;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

function playCallConnectedTone() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.36);
    setTimeout(() => ctx.close().catch(() => {}), 450);
  } catch {}
}

export function DmCallModal({
  isOpen,
  onClose,
  callType,
  callId: callIdProp,
  counterpartUserId,
  counterpartName,
  counterpartAvatar,
  counterpartTitle,
  isIncomingAcceptance = false,
  onCallRecord,
}: DmCallModalProps) {
  const viewerUserId = useViewerUserId();
  const [status, setStatus] = useState<"calling" | "connected" | "ended">(
    isIncomingAcceptance ? "connected" : "calling"
  );
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === "video");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isMockStream, setIsMockStream] = useState(false);
  const [showHttpGuide, setShowHttpGuide] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const callIdRef = useRef<string>(callIdProp || safeRandomUUID());
  const hasRecordedRef = useRef(false);

  // Keep callId in sync if passed
  useEffect(() => {
    if (callIdProp) {
      callIdRef.current = callIdProp;
    }
  }, [callIdProp]);

  const recordCallOnce = (rec: CallRecordPayload) => {
    if (hasRecordedRef.current) return;
    hasRecordedRef.current = true;
    onCallRecord?.(rec);
  };

  // Initialize camera/mic and Socket listeners
  useEffect(() => {
    if (!isOpen) return;

    setStatus(isIncomingAcceptance ? "connected" : "calling");
    setDuration(0);
    setIsVideoEnabled(callType === "video");
    hasRecordedRef.current = false;

    if (isIncomingAcceptance) {
      playCallConnectedTone();
    }

    const socket = getConnectAppSocket();

    if (!isIncomingAcceptance && counterpartUserId && viewerUserId) {
      const callId = callIdRef.current;

      socket.emit("call:initiate", {
        callId,
        recipientUserId: counterpartUserId,
        callerUserId: viewerUserId,
        callerName: "Bạn",
        callType,
      });

      // Ringing timeout (40 seconds)
      const ringTimeout = setTimeout(() => {
        if (status === "calling") {
          setStatus("ended");
          recordCallOnce({ callType, status: "missed", duration: 0 });
          toast.info("Đối phương không trả lời cuộc gọi");
          socket.emit("call:end", {
            callId: callIdRef.current,
            targetUserId: counterpartUserId,
          });
          setTimeout(onClose, 800);
        }
      }, 40000);

      const handleCallAccepted = (payload: any) => {
        if (payload?.callId === callIdRef.current || !payload?.callId) {
          clearTimeout(ringTimeout);
          setStatus("connected");
          playCallConnectedTone();
          toast.success(`Đã kết nối cuộc gọi với ${counterpartName}`);
        }
      };

      const handleCallDeclined = () => {
        clearTimeout(ringTimeout);
        setStatus("ended");
        recordCallOnce({ callType, status: "declined", duration: 0 });
        toast.error(`${counterpartName} đang bận hoặc đã từ chối cuộc gọi`);
        setTimeout(onClose, 1000);
      };

      const handleCallEnded = (payload: any) => {
        clearTimeout(ringTimeout);
        setStatus("ended");
        const finalDuration = payload?.duration || duration;
        recordCallOnce({ callType, status: finalDuration > 0 ? "ended" : "missed", duration: finalDuration });
        toast.info("Cuộc gọi đã kết thúc");
        setTimeout(onClose, 600);
      };

      socket.on("call:accepted", handleCallAccepted);
      socket.on("call:declined", handleCallDeclined);
      socket.on("call:ended", handleCallEnded);

      return () => {
        clearTimeout(ringTimeout);
        socket.off("call:accepted", handleCallAccepted);
        socket.off("call:declined", handleCallDeclined);
        socket.off("call:ended", handleCallEnded);
      };
    } else if (isIncomingAcceptance) {
      const handleCallEnded = (payload: any) => {
        setStatus("ended");
        const finalDuration = payload?.duration || duration;
        recordCallOnce({ callType, status: finalDuration > 0 ? "ended" : "missed", duration: finalDuration });
        toast.info("Cuộc gọi đã kết thúc");
        setTimeout(onClose, 600);
      };
      socket.on("call:ended", handleCallEnded);
      return () => {
        socket.off("call:ended", handleCallEnded);
      };
    }
  }, [isOpen, callType, isIncomingAcceptance, counterpartUserId, viewerUserId, counterpartName, onClose, duration]);

  // WebRTC PeerConnection & Audio/Video transmission
  useEffect(() => {
    if (!isOpen || status !== "connected" || !counterpartUserId) return;

    const socket = getConnectAppSocket();
    let pc: RTCPeerConnection;
    try {
      pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;
    } catch (err) {
      console.warn("[WebRTC] RTCPeerConnection creation failed:", err);
      return;
    }

    // Attach local stream tracks to PeerConnection
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          pc.addTrack(track, streamRef.current!);
        } catch (e) {
          console.warn("[WebRTC] addTrack error:", e);
        }
      });
    }

    // Handle remote track arrival
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        setRemoteStream(stream);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
          remoteAudioRef.current.play().catch(() => {});
        }
        if (remoteVideoRef.current && callType === "video") {
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current.play().catch(() => {});
        }
      }
    };

    // Relay local ICE candidates to peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("call:signal", {
          callId: callIdRef.current,
          targetUserId: counterpartUserId,
          signal: { type: "candidate", candidate: event.candidate },
        });
      }
    };

    // If caller, initiate offer once connected
    if (!isIncomingAcceptance) {
      pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: callType === "video" })
        .then(async (offer) => {
          await pc.setLocalDescription(offer);
          socket.emit("call:signal", {
            callId: callIdRef.current,
            targetUserId: counterpartUserId,
            signal: { type: "offer", sdp: offer },
          });
        })
        .catch((err) => console.warn("[WebRTC] createOffer error:", err));
    }

    // Listen for signaling messages (offer, answer, candidate)
    const handleCallSignal = async (payload: any) => {
      const signal = payload?.signal;
      if (!signal || !pcRef.current) return;
      const peer = pcRef.current;

      try {
        if (signal.type === "offer") {
          await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit("call:signal", {
            callId: callIdRef.current,
            targetUserId: counterpartUserId,
            signal: { type: "answer", sdp: answer },
          });
        } else if (signal.type === "answer") {
          await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        } else if (signal.type === "candidate" && signal.candidate) {
          await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (e) {
        console.warn("[WebRTC] Signal handling error:", e);
      }
    };

    socket.on("call:signal", handleCallSignal);

    return () => {
      socket.off("call:signal", handleCallSignal);
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [isOpen, status, counterpartUserId, isIncomingAcceptance, callType]);

  // Setup safe local media stream (works on HTTPS, localhost and HTTP with virtual fallback)
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    getSafeUserMedia(
      {
        video: callType === "video" ? { facingMode } : false,
        audio: true,
      },
      counterpartName || "Bạn"
    ).then((res) => {
      if (!isMounted) {
        res.stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = res.stream;
      setIsMockStream(res.isMock);
      if (localVideoRef.current && callType === "video") {
        localVideoRef.current.srcObject = res.stream;
      }
    });

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        (streamRef.current as any)._cleanupCanvas?.();
        (streamRef.current as any)._cleanupAudio?.();
        streamRef.current = null;
      }
    };
  }, [isOpen, callType, facingMode, counterpartName]);

  // Call duration timer
  useEffect(() => {
    if (status !== "connected") return;
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  const handleToggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };

  const handleToggleVideo = () => {
    if (isVideoEnabled) {
      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = false;
        });
      }
      setIsVideoEnabled(false);
    } else {
      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = true;
        });
      }
      setIsVideoEnabled(true);
    }
  };

  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const handleEndCall = () => {
    setStatus("ended");
    recordCallOnce({ callType, status: duration > 0 ? "ended" : "missed", duration });
    const socket = getConnectAppSocket();
    if (counterpartUserId) {
      socket.emit("call:end", {
        callId: callIdRef.current,
        targetUserId: counterpartUserId,
        duration,
      });
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      (streamRef.current as any)._cleanupCanvas?.();
      (streamRef.current as any)._cleanupAudio?.();
      streamRef.current = null;
    }
    toast.info("Cuộc gọi đã kết thúc", {
      description: status === "connected" ? `Thời lượng: ${formatTime(duration)}` : undefined,
    });
    setTimeout(() => {
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  const httpGuide = getInsecureContextHelp();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-2xl animate-in fade-in duration-300">
      {/* Background Animated Gradient Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-amber-500/15 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-amber-600/10 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-sm h-[90dvh] max-h-[720px] rounded-3xl border border-white/15 bg-gradient-to-b from-[#141A26]/95 via-[#0D111A]/95 to-[#07090E]/98 p-6 text-white shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Top Bar: Call Type Badge & Status */}
        <div className="flex flex-col gap-2 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#D8B282]/40 bg-[#D8B282]/10 text-xs font-bold uppercase tracking-wider text-[#E8C986]">
              {callType === "video" ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
              <span>{callType === "video" ? "Cuộc gọi Video HD" : "Cuộc gọi thoại"}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#9DA3AE] font-mono">
              {status === "connected" ? (
                <span className="flex items-center gap-1 text-[#22c55e] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                  {formatTime(duration)}
                </span>
              ) : status === "calling" ? (
                <span className="flex items-center gap-1 text-[#E8C986] animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" /> Đang đổ chuông...
                </span>
              ) : (
                <span className="text-red-400">Đã kết thúc</span>
              )}
            </div>
          </div>

          {/* Insecure HTTP / Mock Stream Advisory Badge */}
          {isMockStream && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[10.5px] text-amber-200">
              <span className="truncate">⚡ Chế độ Giả lập Mic/Cam (HTTP)</span>
              <button
                type="button"
                onClick={() => setShowHttpGuide(!showHttpGuide)}
                className="underline font-bold text-amber-300 ml-2 shrink-0 cursor-pointer"
              >
                {showHttpGuide ? "Đóng" : "Mở Cam Thật?"}
              </button>
            </div>
          )}

          {showHttpGuide && (
            <div className="p-3 rounded-2xl bg-black/90 border border-amber-400/40 text-[11px] text-slate-200 text-left space-y-2 shadow-2xl animate-in fade-in duration-200">
              <div className="font-bold text-amber-300">{httpGuide.title}:</div>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[10.5px]">
                {httpGuide.steps.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Hidden Audio Player for Remote Counterpart Voice */}
        <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

        {/* Middle Stage: Video Feed or VIP Avatar */}
        <div className="relative flex-1 flex flex-col items-center justify-center my-6 z-10">
          {callType === "video" && isVideoEnabled ? (
            <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-inner flex items-center justify-center">
              {/* Remote Video Stream if received */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${remoteStream ? "block" : "hidden"}`}
              />

              {/* Local Camera Video (Full if no remote stream, PIP if remote stream active) */}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`object-cover mirror transition-all duration-300 ${
                  remoteStream
                    ? "absolute top-3 right-3 w-28 h-36 rounded-xl border border-[#D8B282]/80 shadow-2xl z-20"
                    : "w-full h-full"
                }`}
                style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
              />

              {/* Floating Counterpart PiP Overlay when remote stream is not yet active */}
              {!remoteStream && (
                <div className="absolute top-3 right-3 w-28 h-36 rounded-xl border border-[#D8B282]/60 bg-slate-900/90 overflow-hidden shadow-2xl flex flex-col items-center justify-center p-2 text-center backdrop-blur-md">
                  {counterpartAvatar ? (
                    <img
                      src={counterpartAvatar}
                      alt={counterpartName}
                      className="w-12 h-12 rounded-full object-cover ring-1 ring-[#D8B282]/80 mb-1.5"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#2C261E] border border-[#D8B282]/60 flex items-center justify-center text-[#E8C986] font-bold mb-1.5">
                      {counterpartName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-[11px] font-bold text-white truncate w-full">{counterpartName}</span>
                  <span className="text-[9.5px] text-[#D8B282] font-medium">Đối tác ViOne</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              {/* Pulsating Halo Rings for Voice Call */}
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-[#D8B282]/20 animate-ping" style={{ animationDuration: "2.5s" }} />
                <div className="absolute -inset-4 rounded-full bg-[#D8B282]/10 blur-md" />

                {counterpartAvatar ? (
                  <img
                    src={counterpartAvatar}
                    alt={counterpartName}
                    className="relative w-28 h-28 rounded-full object-cover ring-4 ring-[#D8B282]/80 shadow-[0_0_40px_rgba(216,178,130,0.3)]"
                  />
                ) : (
                  <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-[#2C261E] via-[#1F1A14] to-[#120F0B] border-2 border-[#D8B282] flex items-center justify-center text-[#E8C986] text-4xl font-extrabold shadow-[0_0_40px_rgba(216,178,130,0.3)]">
                    {counterpartName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <h2 className="text-xl font-bold text-white tracking-tight">{counterpartName}</h2>
              {counterpartTitle && (
                <p className="text-xs text-[#9DA3AE] mt-1 font-medium max-w-[240px] truncate">{counterpartTitle}</p>
              )}
              <p className="text-xs text-[#D8B282] mt-2 font-medium">
                {status === "connected" ? "Đang đàm thoại an toàn" : "Đang chờ đối phương nhận cuộc gọi..."}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Call Controls */}
        <div className="flex flex-col items-center gap-4 z-10">
          <div className="flex items-center justify-center gap-4 w-full">
            {/* Mute Button */}
            <button
              type="button"
              onClick={handleToggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                isMuted
                  ? "bg-red-500/20 border-red-500/50 text-red-400"
                  : "bg-white/10 border-white/20 text-white hover:bg-white/20"
              }`}
              title={isMuted ? "Bật micro" : "Tắt micro"}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Video Toggle (if video call) */}
            {callType === "video" && (
              <>
                <button
                  type="button"
                  onClick={handleToggleVideo}
                  className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                    !isVideoEnabled
                      ? "bg-red-500/20 border-red-500/50 text-red-400"
                      : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                  }`}
                  title={isVideoEnabled ? "Tắt Camera" : "Bật Camera"}
                >
                  {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>

                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  className="w-12 h-12 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer"
                  title="Đổi camera"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </>
            )}

            {/* End Call Button */}
            <button
              type="button"
              onClick={handleEndCall}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-[0_4px_25px_rgba(220,38,38,0.6)] active:scale-95 transition-all cursor-pointer"
              title="Kết thúc cuộc gọi"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
