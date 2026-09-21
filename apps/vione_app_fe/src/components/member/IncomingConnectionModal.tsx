import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  UserCheck,
  Building2,
  Phone,
  Mail,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  User,
} from "lucide-react";
import { fetchNestApi, resolveMediaUrl } from "@/lib/api-client";
import { getConnectAppSocket } from "@/hooks/use-connect-app-socket";
import { toast } from "sonner";

export interface IncomingConnectionData {
  connectionId: string;
  requesterProfile: {
    userId?: string;
    memberCode?: string;
    display_name?: string;
    avatar_url?: string | null;
    job_title?: string | null;
    company_name?: string | null;
    phone?: string | null;
    email?: string | null;
    privacy?: {
      showName?: boolean;
      showCompany?: boolean;
      showPhoto?: boolean;
      showPhone?: boolean;
      showEmail?: boolean;
    };
  };
  timestamp?: string;
}

export function IncomingConnectionModal() {
  const [incoming, setIncoming] = useState<IncomingConnectionData | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const socket = getConnectAppSocket();

    const handleConnectionRequested = (data: any) => {
      if (!data) return;
      console.log("[IncomingConnectionModal] Received connection:requested", data);
      setIncoming({
        connectionId: data.connectionId,
        requesterProfile: data.requesterProfile || {},
        timestamp: data.timestamp,
      });
      setAccepted(false);
      setAccepting(false);
    };

    const handleNotification = (notif: any) => {
      if (
        notif?.eventKind === "connection_request_received" ||
        notif?.notificationKind === "connection_request_received"
      ) {
        const d = notif.safeDisplayData || {};
        setIncoming({
          connectionId: d.connectionId || notif.sourceRecordId,
          requesterProfile: {
            display_name: d.counterpartDisplayName || notif.title,
            avatar_url: d.avatarUrl,
            job_title: d.jobTitle,
            company_name: d.companyName,
            phone: d.phone,
            email: d.email,
            memberCode: d.memberCode,
          },
          timestamp: notif.createdAt,
        });
        setAccepted(false);
      }
    };

    socket.on("connection:requested", handleConnectionRequested);
    socket.on("notification:new", handleNotification);

    return () => {
      socket.off("connection:requested", handleConnectionRequested);
      socket.off("notification:new", handleNotification);
    };
  }, []);

  if (!incoming || typeof document === "undefined") return null;

  const profile = incoming.requesterProfile || {};
  const displayName = profile.display_name || "Doanh nhân CEO 1983";
  const company = profile.company_name || "CLB Doanh Nhân CEO 1983";
  const title = profile.job_title || "Hội viên Chính thức";
  const avatar = profile.avatar_url;
  const phone = profile.phone;
  const email = profile.email;

  const handleAccept = async () => {
    if (!incoming.connectionId) return;
    setAccepting(true);
    try {
      await fetchNestApi(`/network/connections/${encodeURIComponent(incoming.connectionId)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "accepted" }),
      });

      // Gửi sự kiện socket 2 chiều nếu có socket kết nối
      try {
        const socket = getConnectAppSocket();
        socket.emit("connection:accept", {
          connectionId: incoming.connectionId,
          targetUserId: profile.userId,
        });
      } catch {}

      // Cập nhật danh bạ đã kết nối vào localStorage
      try {
        const rawConnected = localStorage.getItem("vba_connected_members");
        const connectedList = rawConnected ? JSON.parse(rawConnected) : [];
        if (profile.memberCode && !connectedList.includes(profile.memberCode)) {
          connectedList.push(profile.memberCode);
        }
        if (profile.userId && !connectedList.includes(profile.userId)) {
          connectedList.push(profile.userId);
        }
        localStorage.setItem("vba_connected_members", JSON.stringify(connectedList));
      } catch {}

      setAccepted(true);
      toast.success(`Đã kết nối thành công với ${displayName}!`);
      window.dispatchEvent(new CustomEvent("vba:conversation_updated"));
      window.dispatchEvent(new CustomEvent("vba:connection_accepted"));
      window.dispatchEvent(new CustomEvent("notifications-updated"));

      setTimeout(() => {
        setIncoming(null);
        setAccepted(false);
      }, 1500);
    } catch {
      toast.error("Không thể phản hồi yêu cầu kết nối. Vui lòng thử lại.");
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (incoming.connectionId) {
      try {
        await fetchNestApi(`/network/connections/${encodeURIComponent(incoming.connectionId)}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "declined" }),
        }).catch(() => {});
      } catch {}
    }
    setIncoming(null);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#0c1427] text-slate-900 dark:text-white shadow-2xl border border-amber-500/30 overflow-hidden m-auto">
        {/* Top Header Banner */}
        <div className="relative h-20 bg-gradient-to-r from-[#003B95] via-[#00224F] to-[#0A1A3A] flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                YÊU CẦU KẾT NỐI MỚI
              </span>
              <h3 className="text-xs font-black text-white">CLB DOANH NHÂN CEO 1983</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIncoming(null)}
            className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Profile Content */}
        <div className="p-5 pt-0 text-center space-y-3">
          {/* Avatar with offset */}
          <div className="relative -mt-9 mx-auto w-18 h-18">
            {avatar ? (
              <img
                src={resolveMediaUrl(avatar) || avatar}
                alt={displayName}
                className="w-full h-full rounded-2xl object-cover ring-3 ring-white dark:ring-[#0c1427] shadow-lg"
              />
            ) : (
              <div className="w-full h-full rounded-2xl bg-amber-100 dark:bg-amber-950/80 flex items-center justify-center text-[#003B95] dark:text-amber-400 font-bold text-xl ring-3 ring-white dark:ring-[#0c1427] shadow-lg">
                <User className="h-8 w-8" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-[#0c1427]">
              <ShieldCheck className="h-3 w-3" />
            </div>
          </div>

          <div>
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              {displayName}
            </h4>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
              <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-600 dark:text-amber-400">
                {title}
              </span>
              {profile.memberCode && (
                <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                  {profile.memberCode}
                </span>
              )}
            </div>
          </div>

          {/* Company / Business */}
          <div className="rounded-xl bg-slate-50 dark:bg-white/[0.04] p-2.5 border border-slate-100 dark:border-white/5 text-[12px] font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5">
            <Building2 className="h-4 w-4 text-[#003B95] dark:text-amber-400 shrink-0" />
            <span className="truncate">{company}</span>
          </div>

          {/* Contact Details respecting privacy */}
          {(phone || email) && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 bg-slate-50/50 dark:bg-white/[0.02] p-2 rounded-xl border border-slate-100 dark:border-white/5">
              {phone && (
                <div className="flex items-center justify-center gap-1.5">
                  <Phone className="h-3 w-3 text-emerald-500" />
                  <span className="font-medium">{phone}</span>
                </div>
              )}
              {email && (
                <div className="flex items-center justify-center gap-1.5">
                  <Mail className="h-3 w-3 text-blue-500" />
                  <span className="font-medium truncate max-w-[240px]">{email}</span>
                </div>
              )}
            </div>
          )}

          <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
            Doanh nhân này vừa quét danh thiếp / chạm thẻ NFC của bạn và mong muốn kết nối hợp tác giao thương.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            {accepted ? (
              <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/30">
                <CheckCircle2 className="h-4 w-4" />
                <span>Đã kết nối thành công!</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDecline}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Để sau
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={accepting}
                  style={{ color: "#ffffff" }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-xs font-bold text-white shadow-md shadow-[#003B95]/20 active:scale-98 transition cursor-pointer disabled:opacity-50"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>{accepting ? "Đang xử lý..." : "Chấp nhận"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
