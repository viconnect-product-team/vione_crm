import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  QrCode,
  Camera,
  X,
  Copy,
  Check,
  Share2,
  Download,
  BadgeCheck,
  Crown,
  Sparkles,
  Zap,
  ZapOff,
  RefreshCw,
  ImagePlus,
  Phone,
  Mail,
  Building2,
  User,
  CheckCircle2,
  ScanLine,
} from "lucide-react";
import { QrCanvas } from "./QrCanvas";
import { useQrScanner } from "@/hooks/use-qr-scanner";
import { fetchNestApi, resolveMediaUrl } from "@/lib/api-client";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { getConnectAppSocket } from "@/hooks/use-connect-app-socket";
import heroImg from "@/assets/vba-hero.jpg";

export interface ScannedPartner {
  code: string;
  name: string;
  company: string;
  title: string;
  avatar: string | null;
  phone?: string | null;
  email?: string | null;
  industry?: string | null;
  userId?: string | null;
  raw?: any;
}

export interface AssociationMemberQrModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: "my_qr" | "scan_qr";
  memberCode?: string;
  memberName?: string;
  memberTitle?: string;
  memberCompany?: string;
  memberAvatar?: string | null;
}

export function AssociationMemberQrModal({
  open,
  onClose,
  defaultTab = "my_qr",
  memberCode = "",
  memberName = "Hội viên CLB CEO 1983",
  memberTitle = "Hội viên chính thức",
  memberCompany = "CLB Doanh Nhân CEO 1983",
  memberAvatar = null,
}: AssociationMemberQrModalProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"my_qr" | "scan_qr">(defaultTab);
  const [copied, setCopied] = useState(false);

  // Scanner state
  const [torch, setTorch] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [scannedPartner, setScannedPartner] = useState<ScannedPartner | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDecodingFile, setIsDecodingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
      setScannedPartner(null);
      setConnected(false);
      setErrorMsg(null);
      setTorch(false);
    }
  }, [open, defaultTab]);

  const qrUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/card/${memberCode}`
      : `https://ceo1983club.com/card/${memberCode}`;


  // Auto-close QR modal if someone connects to this user, allowing IncomingConnectionModal to pop up cleanly
  useEffect(() => {
    if (!open) return;
    const socket = getConnectAppSocket();
    const handleClose = () => {
      onClose();
    };
    socket.on("connection:requested", handleClose);
    socket.on("vba:close_qr_modal", handleClose);
    return () => {
      socket.off("connection:requested", handleClose);
      socket.off("vba:close_qr_modal", handleClose);
    };
  }, [open, onClose]);


  const { videoRef, status, hasTorch, scanImageFile } = useQrScanner({
    active: open && activeTab === "scan_qr" && !scannedPartner,
    torch,
    facingMode,
    onDetect: (value) => {
      void handleQrValue(value);
    },
  });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      toast.success("Đã sao chép liên kết mã QR!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép liên kết");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mã QR Hội Viên CEO 1983 - ${memberName}`,
          text: `${memberName} · ${memberTitle} · ${memberCompany}`,
          url: qrUrl,
        });
      } catch {
        /* share dismissed */
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQr = () => {
    const canvas = document.getElementById("association-member-modal-qr") as HTMLCanvasElement;
    if (!canvas) {
      toast.error("Không tìm thấy mã QR để tải về");
      return;
    }
    try {
      const a = document.createElement("a");
      a.download = `QR-CEO1983-${memberCode}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
      toast.success("Đã tải ảnh mã QR về máy!");
    } catch {
      toast.error("Lỗi khi tải ảnh mã QR");
    }
  };

  // QR parsing logic for scanner tab
  const handleQrValue = async (raw: string) => {
    if (!raw) return;
    setErrorMsg(null);

    let code: string | null = null;
    if (raw.includes("CEO1983-MEMBER:")) {
      code = raw.replace("CEO1983-MEMBER:", "").trim();
    } else if (raw.includes("/card/")) {
      const match = raw.match(/\/card\/([^/?#]+)/);
      if (match) code = match[1];
    } else if (raw.includes("/b/")) {
      const match = raw.match(/\/b\/([^/?#]+)/);
      if (match) code = match[1];
    } else if (/^[A-Za-z0-9_-]{3,32}$/.test(raw.trim())) {
      code = raw.trim();
    }

    if (raw.includes("BEGIN:VCARD")) {
      const nameMatch = raw.match(/FN:(.*)/i);
      const phoneMatch = raw.match(/TEL.*:(.*)/i);
      const emailMatch = raw.match(/EMAIL.*:(.*)/i);
      const orgMatch = raw.match(/ORG:(.*)/i);
      const titleMatch = raw.match(/TITLE:(.*)/i);

      setScannedPartner({
        code: "VCARD",
        name: nameMatch ? nameMatch[1].trim() : "Đối tác vCard",
        company: orgMatch ? orgMatch[1].trim() : "Doanh nghiệp",
        title: titleMatch ? titleMatch[1].trim() : "Thành viên",
        avatar: null,
        phone: phoneMatch ? phoneMatch[1].trim() : null,
        email: emailMatch ? emailMatch[1].trim() : null,
        raw,
      });
      return;
    }

    if (!code) {
      setErrorMsg("Mã QR không đúng định dạng hội viên CEO 1983");
      return;
    }

    try {
      const res = await fetchNestApi<any>(`/api/members/${code}`);
      if (res && res.name) {
        setScannedPartner({
          code: res.code || code,
          name: res.name,
          company: res.companyName || res.company || "CLB CEO 1983",
          title: res.title || res.industry || "Hội viên",
          avatar: res.avatar ? resolveMediaUrl(res.avatar) || res.avatar : null,
          phone: res.phone || null,
          email: res.email || null,
          industry: res.industry || null,
          userId: res.userId || null,
        });
      } else {
        setScannedPartner({
          code,
          name: `Hội viên ${code}`,
          company: "CLB Doanh Nhân CEO 1983",
          title: "Hội viên chính thức",
          avatar: null,
        });
      }
    } catch {
      setScannedPartner({
        code,
        name: `Hội viên ${code}`,
        company: "CLB Doanh Nhân CEO 1983",
        title: "Hội viên chính thức",
        avatar: null,
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsDecodingFile(true);
    setErrorMsg(null);
    try {
      const result = await scanImageFile(file);
      if (result) {
        await handleQrValue(result);
      } else {
        setErrorMsg("Không tìm thấy mã QR hợp lệ trong ảnh tải lên");
      }
    } catch {
      setErrorMsg("Không thể phân tích ảnh");
    } finally {
      setIsDecodingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveContact = async () => {
    if (!scannedPartner) return;
    setConnecting(true);
    try {
      const peerCode = scannedPartner.code || scannedPartner.userId || "MEMBER";
      const peerName = scannedPartner.name || "Hội viên";

      // 1. Lưu danh bạ kết nối cá nhân
      await fetchNestApi("/api/members/contacts", {
        method: "POST",
        body: JSON.stringify({
          targetCode: scannedPartner.code,
          targetName: scannedPartner.name,
          targetCompany: scannedPartner.company,
          targetTitle: scannedPartner.title,
        }),
      }).catch(() => {});

      // 2. Real-time handshake: Gửi yêu cầu kết nối để thiết bị đối tác tự động đóng QR và bật popup thông tin của mình
      await fetchNestApi("/network/requests", {
        method: "POST",
        body: JSON.stringify({
          targetUserId: scannedPartner.userId || scannedPartner.code,
          memberCode: scannedPartner.code,
        }),
      }).catch(() => {
        return fetchNestApi("/connect-app/network/requests", {
          method: "POST",
          body: JSON.stringify({
            targetUserId: scannedPartner.userId || scannedPartner.code,
            memberCode: scannedPartner.code,
          }),
        }).catch(() => {});
      });

      // 3. Khởi tạo hội thoại qua DM API trên backend (để backend tạo thread chat chuẩn)
      await fetchNestApi("/dm/member/messages", {
        method: "POST",
        body: JSON.stringify({
          peerCode: peerCode,
          text: "Xin chào! Chúng ta vừa kết nối thành công qua mã QR danh thiếp.",
        }),
      }).catch(() => {});

      setConnected(true);

      // 4. Lưu thông báo và đồng bộ hội thoại sang tab Tin nhắn
      try {
        const newNotif = {
          id: `qr_conn_${Date.now()}`,
          title: "Kết nối giao thương mới",
          body: `Bạn đã kết nối thành công với ${peerName} qua quét mã QR.`,
          createdAt: new Date().toISOString(),
          unread: true,
          type: "connection",
          avatar: scannedPartner.avatar,
        };
        const rawNotifs = localStorage.getItem("vba_notifications");
        const notifs = rawNotifs ? JSON.parse(rawNotifs) : [];
        notifs.unshift(newNotif);
        localStorage.setItem("vba_notifications", JSON.stringify(notifs.slice(0, 50)));

        // Lưu vào danh sách hội viên đã kết nối
        const rawConnected = localStorage.getItem("vba_connected_members");
        const connectedList: string[] = rawConnected ? JSON.parse(rawConnected) : [];
        if (!connectedList.includes(peerCode)) connectedList.push(peerCode);
        if (scannedPartner.code && !connectedList.includes(scannedPartner.code)) {
          connectedList.push(scannedPartner.code);
        }
        if (scannedPartner.userId && !connectedList.includes(scannedPartner.userId)) {
          connectedList.push(scannedPartner.userId);
        }
        localStorage.setItem("vba_connected_members", JSON.stringify(connectedList));

        // Lưu vào danh sách cuộc trò chuyện gần đây (vba.recent_conversations)
        const initialText = "Đã kết nối qua mã QR. Bắt đầu trò chuyện!";
        const newConv = {
          peerCode: peerCode,
          name: peerName,
          last: initialText,
          unread: 0,
          unreadCount: 0,
          isOnline: true,
          time: "Vừa xong",
          rawTime: new Date().toISOString(),
          avatarUrl: scannedPartner.avatar || null,
          userId: scannedPartner.userId || null,
          isConnected: true,
          isQrConnected: true,
        };

        const rawRecents = localStorage.getItem("vba.recent_conversations");
        let recents: any[] = [];
        try {
          recents = rawRecents ? JSON.parse(rawRecents) : [];
          if (!Array.isArray(recents)) recents = [];
        } catch {
          recents = [];
        }
        recents = recents.filter((c) => c.peerCode?.toLowerCase() !== peerCode.toLowerCase());
        recents.unshift(newConv);
        localStorage.setItem("vba.recent_conversations", JSON.stringify(recents));

        // Lưu tin nhắn khởi tạo thread chat
        const chatKey = `vba.chat.${peerCode}`;
        const existingChat = localStorage.getItem(chatKey);
        if (!existingChat) {
          const initMessages = [
            {
              id: `qr_init_${Date.now()}`,
              from: "system",
              sender: "Hệ thống kết nối QR",
              text: `Bạn và ${peerName} đã kết nối thành công qua mã QR danh thiếp. Bắt đầu giao lưu hợp tác kinh doanh!`,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              isSystem: true,
              createdAt: new Date().toISOString(),
            },
          ];
          localStorage.setItem(chatKey, JSON.stringify(initMessages));
        }

        window.dispatchEvent(new CustomEvent("notifications-updated"));
        window.dispatchEvent(new CustomEvent("vba:conversation_updated", { detail: newConv }));
      } catch (err) {
        console.warn("Storage error when saving QR connection:", err);
      }
    } catch {
      setConnected(true);
    } finally {
      setConnecting(false);
    }
  };

  const handleModalClose = () => {
    setActiveTab("my_qr");
    setScannedPartner(null);
    setTorch(false);
    onClose();
  };

  if (!open) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[99999] grid place-items-center w-full h-[100dvh] min-h-[100dvh] bg-black/80 backdrop-blur-md p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-200 pt-[max(env(safe-area-inset-top,0px),16px)] pb-[max(env(safe-area-inset-bottom,0px),16px)]">
      <div className="relative w-full max-w-sm my-auto rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[88dvh] select-none">
        {/* Modal Top Header with Close Button */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2E3192]/10 dark:bg-amber-400/10 text-[#2E3192] dark:text-amber-400">
              <QrCode className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                Mã QR Hội Viên
              </h3>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                CLB Doanh Nhân CEO 1983
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleModalClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition active:scale-95 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher: [Mã QR của tôi] vs [Quét QR] */}
        <div className="px-5 pt-3">
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-[#14223E] p-1 border border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab("my_qr");
                setScannedPartner(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "my_qr"
                  ? "bg-[#2E3192] text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-[#2E3192]"
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Mã QR của tôi</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("scan_qr")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "scan_qr"
                  ? "bg-[#2E3192] text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-[#2E3192]"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Quét QR</span>
            </button>
          </div>
        </div>

        {/* TAB 1: MÃ QR CỦA TÔI */}
        {activeTab === "my_qr" && (
          <div className="p-5 flex flex-col items-center overflow-y-auto">
            {/* Member Card Summary */}
            <div className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 mb-4">
              <div className="relative">
                {memberAvatar ? (
                  <img
                    src={memberAvatar}
                    alt={memberName}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-white dark:ring-slate-700 shadow-sm"
                  />
                ) : (
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-tr from-[#2E3192] to-[#19194D] text-sm font-black text-white ring-2 ring-white dark:ring-slate-700 shadow-sm">
                    {memberName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs">
                  <Crown className="h-2.5 w-2.5" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <h4 className="truncate text-sm font-black text-slate-900 dark:text-white">
                    {memberName}
                  </h4>
                  <BadgeCheck className="h-4 w-4 text-[#0284c7] shrink-0" />
                </div>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {memberTitle} · {memberCompany}
                </p>
                <div className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-mono font-bold text-[#2E3192] dark:text-amber-400">
                  <span>ID: {memberCode}</span>
                </div>
              </div>
            </div>

            {/* High-Res QR Canvas Card with Brand Ornament */}
            <div className="relative p-4 rounded-2xl bg-white shadow-lg border border-slate-200 flex flex-col items-center">
              <div id="association-member-modal-qr">
                <QrCanvas value={qrUrl} size={180} />
              </div>
              <div className="mt-2.5 text-center">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#2E3192]/10 px-2.5 py-0.5 text-[10.5px] font-bold text-[#2E3192]">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Quét để kết nối hồ sơ danh thiếp
                </span>
              </div>
            </div>

            {/* Action Buttons: Tải ảnh, Chia sẻ, Sao chép link */}
            <div className="w-full grid grid-cols-3 gap-2 mt-4">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition active:scale-95 cursor-pointer"
              >
                <Download className="h-4 w-4 text-[#2E3192] dark:text-amber-400" />
                <span>Tải ảnh QR</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl bg-gradient-to-r from-[#19194D] to-[#2E3192] hover:brightness-110 text-white text-[11px] font-bold transition active:scale-95 cursor-pointer shadow-sm"
              >
                <Share2 className="h-4 w-4" />
                <span>Chia sẻ</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition active:scale-95 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-600">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-slate-500" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: QUÉT QR CAMERA */}
        {activeTab === "scan_qr" && (
          <div className="p-5 flex flex-col items-center overflow-y-auto">
            {scannedPartner ? (
              /* Scanned Partner Result Card */
              <div className="w-full flex flex-col items-center py-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="relative mb-3">
                  {scannedPartner.avatar ? (
                    <img
                      src={scannedPartner.avatar}
                      alt={scannedPartner.name}
                      className="h-18 w-18 rounded-full object-cover ring-3 ring-amber-400 shadow-md"
                    />
                  ) : (
                    <div className="grid h-18 w-18 place-items-center rounded-full bg-gradient-to-tr from-[#2E3192] to-[#19194D] text-lg font-black text-white ring-3 ring-amber-400 shadow-md">
                      {scannedPartner.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                </div>

                <div className="text-center mb-3">
                  <div className="flex items-center justify-center gap-1">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {scannedPartner.name}
                    </h3>
                    <BadgeCheck className="h-4 w-4 text-[#0284c7]" />
                  </div>
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                    {scannedPartner.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {scannedPartner.company}
                  </p>
                  <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                    ID: {scannedPartner.code}
                  </div>
                </div>

                {/* Direct Contact info if present */}
                {(scannedPartner.phone || scannedPartner.email) && (
                  <div className="w-full rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 space-y-1 text-xs text-slate-700 dark:text-slate-300 mb-4 border border-slate-200/70 dark:border-slate-700/60">
                    {scannedPartner.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-[#2E3192] dark:text-amber-400 shrink-0" />
                        <a
                          href={`tel:${scannedPartner.phone}`}
                          className="hover:underline font-semibold"
                        >
                          {scannedPartner.phone}
                        </a>
                      </div>
                    )}
                    {scannedPartner.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-[#2E3192] dark:text-amber-400 shrink-0" />
                        <a href={`mailto:${scannedPartner.email}`} className="hover:underline">
                          {scannedPartner.email}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="w-full flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setScannedPartner(null)}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition active:scale-95 cursor-pointer text-center"
                  >
                    Quét lại
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveContact}
                    disabled={connecting || connected}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-sm ${
                      connected
                        ? "bg-emerald-600 text-white"
                        : "bg-[#2E3192] text-white hover:bg-[#19194D]"
                    }`}
                  >
                    {connected ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Đã lưu kết nối</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                        <span>{connecting ? "Đang lưu..." : "Lưu kết nối"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Camera Scanner Viewfinder in Modal */
              <div className="w-full flex flex-col items-center">
                <div className="relative w-full aspect-square max-w-[260px] rounded-2xl overflow-hidden bg-black border-2 border-[#2E3192] shadow-inner flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Corner Targets */}
                  <div className="absolute inset-4 pointer-events-none">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-amber-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-amber-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-amber-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-amber-400 rounded-br-lg" />
                    <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-0.5 bg-amber-400/80 shadow-[0_0_8px_rgba(245,130,32,0.8)] animate-pulse" />
                  </div>

                  {status === "starting" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white text-xs gap-2 p-4 text-center">
                      <RefreshCw className="h-5 w-5 animate-spin text-amber-400" />
                      <span>Đang kết nối camera...</span>
                    </div>
                  )}

                  {status === "denied" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 text-white text-xs gap-2 p-4 text-center">
                      <Camera className="h-6 w-6 text-red-400" />
                      <span className="font-bold text-red-400">Không có quyền truy cập camera</span>
                      <span className="text-[10px] text-slate-300">
                        Vui lòng cấp quyền camera trong cài đặt trình duyệt để quét
                      </span>
                    </div>
                  )}

                  {(status === "unsupported" || (typeof window !== "undefined" && !window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1")) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 text-white text-xs gap-2.5 p-4 text-center z-10">
                      <div className="p-2.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        <Camera className="h-6 w-6" />
                      </div>
                      <span className="font-bold text-white text-xs">
                        Camera trực tiếp cần kết nối HTTPS bảo mật hoặc App độc lập
                      </span>
                      <span className="text-[10.5px] text-slate-300 leading-relaxed max-w-[220px]">
                        Nhấn nút dưới để mở trực tiếp máy ảnh thiết bị chụp mã QR
                      </span>
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="mt-1 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-white font-bold text-xs shadow-md active:scale-95 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Camera className="h-4 w-4" />
                        <span>Mở Máy Ảnh Chụp QR</span>
                      </button>
                    </div>
                  )}
                </div>

                {errorMsg && (
                  <div className="mt-2.5 text-center text-xs text-red-500 font-semibold px-2">
                    {errorMsg}
                  </div>
                )}

                {/* Scanner Controls: Torch, Switch Camera, Pick from Photos, Direct Snap */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isDecodingFile}
                    className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-white text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
                    title="Mở máy ảnh chụp mã QR trực tiếp"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Chụp ảnh</span>
                  </button>

                  {hasTorch && (
                    <button
                      type="button"
                      onClick={() => setTorch(!torch)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border transition active:scale-95 cursor-pointer ${
                        torch
                          ? "bg-amber-500 text-white border-amber-400 shadow-md"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                      title="Bật/tắt đèn flash"
                    >
                      {torch ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer"
                    title="Đổi camera trước/sau"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isDecodingFile}
                    className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition active:scale-95 cursor-pointer hover:border-[#2E3192]"
                    title="Tải ảnh QR từ máy"
                  >
                    <ImagePlus className="h-4 w-4 text-[#2E3192] dark:text-amber-400" />
                    <span>{isDecodingFile ? "Đang đọc..." : "Chọn ảnh"}</span>
                  </button>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
}
