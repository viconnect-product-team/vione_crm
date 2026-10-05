import { useEffect, useRef, useState, useCallback, useMemo } from "react";
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
  ShieldCheck,
  AlertCircle,
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
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
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
  const [permissionIssue, setPermissionIssue] = useState(false);
  const [showHttpGuide, setShowHttpGuide] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [needAudioUnmute, setNeedAudioUnmute] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const callIdRef = useRef<string>(callIdProp || safeRandomUUID());
  const hasRecordedRef = useRef(false);

  // Lấy thông tin thật của người gọi để bên nhận thấy rõ tên và avatar
  const myProfile = useMemo(() => {
    try {
      const rawCustom = localStorage.getItem("vba_custom_profile");
      if (rawCustom) {
        const p = JSON.parse(rawCustom);
        if (p.name || p.displayName) {
          return {
            name: p.name || p.displayName,
            avatar: p.avatar || p.avatarUrl || null,
            title: p.jobTitle || p.headline || null,
          };
        }
      }
      const rawUser = localStorage.getItem("vibe_user") || localStorage.getItem("user");
      if (rawUser) {
        const u = JSON.parse(rawUser);
        return {
          name: u.name || u.displayName || u.fullName || u.email?.split("@")[0] || "Lãnh đạo ViOne",
          avatar: u.avatar || u.avatarUrl || null,
          title: u.jobTitle || u.role || null,
        };
      }
    } catch {}
    return { name: "Lãnh đạo ViOne", avatar: null, title: null };
  }, []);

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

  // Khởi tạo Microphone & Camera thật từ thiết bị
  const initUserMedia = useCallback(async () => {
    try {
      const res = await getSafeUserMedia(
        {
          video: callType === "video" ? { facingMode, width: { ideal: 640 }, height: { ideal: 480 } } : false,
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        },
        counterpartName || "Bạn"
      );

      streamRef.current = res.stream;
      setPermissionIssue(res.isMock && res.reason === "permission_denied");

      if (localVideoRef.current && callType === "video") {
        localVideoRef.current.srcObject = res.stream;
        localVideoRef.current.play().catch(() => {});
      }

      // Nếu RTCPeerConnection đã sẵn sàng, thêm ngay tracks vào connection
      if (pcRef.current) {
        const senders = pcRef.current.getSenders();
        res.stream.getTracks().forEach((track) => {
          const alreadyAdded = senders.some((s) => s.track === track);
          if (!alreadyAdded) {
            try {
              pcRef.current?.addTrack(track, res.stream);
            } catch (e) {
              console.warn("[WebRTC] addTrack error:", e);
            }
          }
        });
      }
      return res.stream;
    } catch (err) {
      console.warn("[WebRTC] Media init failed:", err);
      setPermissionIssue(true);
      return null;
    }
  }, [callType, facingMode, counterpartName]);

  // Request media when modal opens
  useEffect(() => {
    if (!isOpen) return;
    void initUserMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        (streamRef.current as any)._cleanupCanvas?.();
        (streamRef.current as any)._cleanupAudio?.();
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close().catch(() => {});
        } catch {}
        audioContextRef.current = null;
      }
    };
  }, [isOpen, initUserMedia]);

  // Handle Socket Events & Call States
  useEffect(() => {
    if (!isOpen) return;

    setStatus(isIncomingAcceptance ? "connected" : "calling");
    setDuration(0);
    setIsVideoEnabled(callType === "video");
    hasRecordedRef.current = false;
    setNeedAudioUnmute(false);

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
        callerName: myProfile.name,
        callerAvatar: myProfile.avatar,
        callerTitle: myProfile.title,
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
          toast.success(`Đã kết nối cuộc gọi thoại/video với ${counterpartName}`);
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
  }, [isOpen, callType, isIncomingAcceptance, counterpartUserId, viewerUserId, counterpartName, onClose, duration, myProfile]);

  // WebRTC PeerConnection Real P2P Transmission
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

    pendingCandidatesRef.current = [];

    // Helper: Thêm tracks vào peer an toàn
    const attachLocalTracks = (stream: MediaStream) => {
      const senders = pc.getSenders();
      stream.getTracks().forEach((track) => {
        const exists = senders.some((s) => s.track === track);
        if (!exists) {
          try {
            pc.addTrack(track, stream);
          } catch (e) {
            console.warn("[WebRTC] attach track error:", e);
          }
        }
      });
    };

    if (streamRef.current) {
      attachLocalTracks(streamRef.current);
    }

    // Nhận luồng âm thanh & hình ảnh thật từ đối phương
    pc.ontrack = (event) => {
      let stream = event.streams && event.streams[0];
      if (!stream) {
        stream = new MediaStream([event.track]);
      }
      setRemoteStream(stream);

      // 1. Web Audio API Routing: Phá vỡ rào cản Autoplay Policy của trình duyệt
      if (event.track.kind === "audio") {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            if (!audioContextRef.current) {
              audioContextRef.current = new AudioContextClass();
            }
            const ctx = audioContextRef.current;
            if (ctx.state === "suspended") {
              void ctx.resume();
            }
            const source = ctx.createMediaStreamSource(stream);
            source.connect(ctx.destination);
          }
        } catch (err) {
          console.warn("[WebRTC] AudioContext route error:", err);
        }
      }

      // 2. Element Audio / Video
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.volume = 1.0;
        remoteAudioRef.current.play().catch((err) => {
          console.warn("[WebRTC] remoteAudio autoplay blocked, prompting user:", err);
          setNeedAudioUnmute(true);
        });
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.play().catch(() => {});
      }
    };

    // Trao đổi ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("call:signal", {
          callId: callIdRef.current,
          targetUserId: counterpartUserId,
          signal: { type: "candidate", candidate: event.candidate },
        });
      }
    };

    // Hàm drain candidate queue an toàn
    const drainPendingCandidates = async (peer: RTCPeerConnection) => {
      while (pendingCandidatesRef.current.length > 0) {
        const candidate = pendingCandidatesRef.current.shift();
        if (candidate) {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn("[WebRTC] drain candidate error:", e);
          }
        }
      }
    };

    // Người gọi tạo Offer (chờ local tracks được nạp đầy đủ)
    if (!isIncomingAcceptance) {
      const sendOffer = async () => {
        if (!streamRef.current) {
          await initUserMedia();
        }
        if (streamRef.current) {
          attachLocalTracks(streamRef.current);
        }
        try {
          const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: callType === "video" });
          await pc.setLocalDescription(offer);
          socket.emit("call:signal", {
            callId: callIdRef.current,
            targetUserId: counterpartUserId,
            signal: { type: "offer", sdp: offer },
          });
        } catch (err) {
          console.warn("[WebRTC] createOffer error:", err);
        }
      };
      void sendOffer();
    }

    // Lắng nghe tín hiệu Signaling (offer, answer, candidate)
    const handleCallSignal = async (payload: any) => {
      const signal = payload?.signal;
      if (!signal || !pcRef.current) return;
      const peer = pcRef.current;

      try {
        if (signal.type === "offer") {
          // Bắt buộc callee phải nạp local media tracks TRƯỚC KHI tạo answer!
          if (!streamRef.current) {
            await initUserMedia();
          }
          if (streamRef.current) {
            attachLocalTracks(streamRef.current);
          }

          await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          await drainPendingCandidates(peer);

          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit("call:signal", {
            callId: callIdRef.current,
            targetUserId: counterpartUserId,
            signal: { type: "answer", sdp: answer },
          });
        } else if (signal.type === "answer") {
          await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          await drainPendingCandidates(peer);
        } else if (signal.type === "candidate" && signal.candidate) {
          if (peer.remoteDescription) {
            await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } else {
            pendingCandidatesRef.current.push(signal.candidate);
          }
        }
      } catch (e) {
        console.warn("[WebRTC] Signal processing error:", e);
      }
    };

    socket.on("call:signal", handleCallSignal);

    return () => {
      socket.off("call:signal", handleCallSignal);
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      pendingCandidatesRef.current = [];
    };
  }, [isOpen, status, counterpartUserId, isIncomingAcceptance, callType, initUserMedia]);

  // Bộ đếm thời gian đàm thoại
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

  const handleUnmuteAudioManually = () => {
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      void audioContextRef.current.resume();
    }
    if (remoteAudioRef.current) {
      void remoteAudioRef.current.play();
    }
    setNeedAudioUnmute(false);
    toast.success("Đã bật âm thanh cuộc gọi");
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
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close().catch(() => {});
      } catch {}
      audioContextRef.current = null;
    }
    toast.info("Cuộc gọi đã kết thúc", {
      description: status === "connected" ? `Thời lượng: ${formatTime(duration)}` : undefined,
    });
    setTimeout(() => {
      onClose();
    }, 500);
  };

  if (!isOpen) return null;

  const httpGuide = getInsecureContextHelp();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 dark:bg-black/90 p-4 backdrop-blur-2xl animate-in fade-in duration-300">
      {/* Background Animated Gradient Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-amber-500/15 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-amber-600/10 blur-[100px]" />
      </div>

      {/* Card cuộc gọi: Hỗ trợ Full Theme Sáng & Theme Tối đẳng cấp */}
      <div className="relative w-full max-w-sm h-[90dvh] max-h-[720px] rounded-3xl border border-[#DFB76C]/60 dark:border-[#DFB76C]/30 bg-gradient-to-b from-white via-[#FAF8F5] to-[#F5F0E8] dark:from-[#141A26]/98 dark:via-[#0D111A]/98 dark:to-[#07090E]/99 p-6 text-slate-900 dark:text-white shadow-[0_20px_60px_rgba(0,0,0,0.25)] dark:shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Top Bar: Call Type Badge & Status */}
        <div className="flex flex-col gap-2 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#D8B282]/50 bg-[#DFB76C]/15 dark:bg-[#DFB76C]/10 text-xs font-bold uppercase tracking-wider text-[#8C653B] dark:text-[#F6E1C3]">
              {callType === "video" ? <Video className="w-3.5 h-3.5 text-[#8C653B] dark:text-[#DFB76C]" /> : <Phone className="w-3.5 h-3.5 text-[#8C653B] dark:text-[#DFB76C]" />}
              <span>{callType === "video" ? "Cuộc gọi Video HD" : "Cuộc gọi thoại"}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-[#9DA3AE] font-mono">
              {status === "connected" ? (
                <span className="flex items-center gap-1 text-[#16a34a] dark:text-[#22c55e] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#16a34a] dark:bg-[#22c55e] animate-pulse" />
                  {formatTime(duration)}
                </span>
              ) : status === "calling" ? (
                <span className="flex items-center gap-1 text-[#8C653B] dark:text-[#DFB76C] animate-pulse font-medium">
                  <Sparkles className="w-3.5 h-3.5" /> Đang đổ chuông...
                </span>
              ) : (
                <span className="text-red-500 dark:text-red-400">Đã kết thúc</span>
              )}
            </div>
          </div>

          {/* Trạng thái bảo mật P2P */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-500/10 dark:bg-slate-900/60 border border-amber-500/30 dark:border-white/10 text-[10.5px] text-slate-800 dark:text-slate-300">
            <span className="flex items-center gap-1.5 text-[#8C653B] dark:text-[#DFB76C] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Đàm thoại trực tiếp bảo mật P2P</span>
            </span>
            {permissionIssue && (
              <button
                type="button"
                onClick={() => void initUserMedia()}
                className="underline font-bold text-amber-600 dark:text-amber-400 ml-2 shrink-0 cursor-pointer"
              >
                Cấp quyền Mic/Cam
              </button>
            )}
          </div>

          {/* Prompt Unmute nếu trình duyệt chặn âm thanh autoplay */}
          {needAudioUnmute && (
            <button
              type="button"
              onClick={handleUnmuteAudioManually}
              className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md animate-pulse cursor-pointer"
            >
              <Volume2 className="w-4 h-4" /> Bấm để bật âm thanh đối phương
            </button>
          )}

          {showHttpGuide && (
            <div className="p-3 rounded-2xl bg-white dark:bg-black/95 border border-[#DFB76C]/40 text-[11px] text-slate-800 dark:text-slate-200 text-left space-y-2 shadow-2xl animate-in fade-in duration-200">
              <div className="font-bold text-[#8C653B] dark:text-[#DFB76C]">{httpGuide.title}:</div>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300 text-[10.5px]">
                {httpGuide.steps.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Audio Player for Remote Counterpart Voice (Luôn tự động phát giọng đối phương) */}
        <audio ref={remoteAudioRef} autoPlay playsInline className="opacity-0 pointer-events-none fixed -top-40" />

        {/* Middle Stage: Video Feed or VIP Avatar */}
        <div className="relative flex-1 flex flex-col items-center justify-center my-6 z-10">
          {callType === "video" && isVideoEnabled ? (
            <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-black shadow-inner flex items-center justify-center">
              {/* Remote Video Stream từ camera đối phương */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${remoteStream ? "block" : "hidden"}`}
              />

              {/* Local Camera Video (PIP khi đã kết nối) */}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`object-cover transition-all duration-300 ${
                  remoteStream
                    ? "absolute top-3 right-3 w-28 h-36 rounded-xl border border-[#DFB76C]/80 shadow-2xl z-20"
                    : "w-full h-full"
                }`}
                style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
              />

              {/* Overlay ảnh đại diện khi đối phương đang kết nối */}
              {!remoteStream && (
                <div className="absolute top-3 right-3 w-28 h-36 rounded-xl border border-[#DFB76C]/60 bg-white/95 dark:bg-slate-900/90 overflow-hidden shadow-2xl flex flex-col items-center justify-center p-2 text-center backdrop-blur-md">
                  {counterpartAvatar ? (
                    <img
                      src={counterpartAvatar}
                      alt={counterpartName}
                      className="w-12 h-12 rounded-full object-cover ring-1 ring-[#DFB76C]/80 mb-1.5"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#F6E1C3] dark:bg-[#1A2234] border border-[#DFB76C]/60 flex items-center justify-center text-slate-900 dark:text-[#F6E1C3] font-bold mb-1.5">
                      {counterpartName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-[10px] font-bold text-slate-900 dark:text-white truncate max-w-[90px]">{counterpartName}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                {/* Glowing Animated Ring */}
                <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-[#DFB76C]/40 to-amber-600/30 blur-md animate-pulse" />
                <div className="relative w-28 h-28 rounded-full border-2 border-[#DFB76C] p-1 shadow-2xl bg-white dark:bg-slate-950 flex items-center justify-center overflow-hidden">
                  {counterpartAvatar ? (
                    <img
                      src={counterpartAvatar}
                      alt={counterpartName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] flex items-center justify-center text-slate-950 text-3xl font-black">
                      {counterpartName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Tên và thông tin đối phương - RÕ NÉT CẢ THEME SÁNG LẪN TỐI */}
              <div className="text-center space-y-1">
                <h3 className="text-2xl font-black !text-slate-950 dark:!text-white tracking-tight">{counterpartName}</h3>
                <p className="text-xs text-[#8C653B] dark:text-[#DFB76C] font-bold">{counterpartTitle || "Doanh nhân ViOne"}</p>
                <p className="text-[11.5px] text-slate-600 dark:text-slate-400 font-medium">
                  {status === "connected" ? "Đang đàm thoại trực tiếp" : "Đang chờ kết nối tín hiệu..."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Call Action Controls */}
        <div className="flex items-center justify-around z-10 pt-2">
          {/* Mute Microphone */}
          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={isMuted ? "Bật micro" : "Tắt micro"}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-full border transition active:scale-95 cursor-pointer ${
              isMuted
                ? "bg-rose-500/20 border-rose-500 text-rose-600 dark:text-rose-400"
                : "bg-slate-100 dark:bg-white/10 border-slate-300 dark:border-white/20 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20"
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Toggle Camera (chỉ cho Video Call) */}
          {callType === "video" && (
            <button
              type="button"
              onClick={handleToggleVideo}
              aria-label={isVideoEnabled ? "Tắt camera" : "Bật camera"}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-full border transition active:scale-95 cursor-pointer ${
                !isVideoEnabled
                  ? "bg-rose-500/20 border-rose-500 text-rose-600 dark:text-rose-400"
                  : "bg-slate-100 dark:bg-white/10 border-slate-300 dark:border-white/20 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20"
              }`}
            >
              {!isVideoEnabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          {/* Đổi Camera trước / sau (chỉ cho Video Call) */}
          {callType === "video" && isVideoEnabled && (
            <button
              type="button"
              onClick={handleSwitchCamera}
              aria-label="Đổi camera trước/sau"
              className="flex flex-col items-center justify-center w-12 h-12 rounded-full border border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20 transition active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}

          {/* Kết thúc cuộc gọi */}
          <button
            type="button"
            onClick={handleEndCall}
            aria-label="Kết thúc cuộc gọi"
            className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 transition active:scale-90 cursor-pointer"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
