import { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  UserPlus,
  Copy,
  Check,
  Share2,
  QrCode,
  Sparkles,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { QrCanvas } from "@/components/member/QrCanvas";
import { toast } from "sonner";

export interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberCode?: string;
  memberName?: string;
}

export function InviteMemberModal({
  isOpen,
  onClose,
  memberCode = "M1983-002",
  memberName = "Hội viên CEO 1983",
}: InviteMemberModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<"formal" | "friendly">("formal");

  if (!isOpen || typeof document === "undefined") return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://ceo1983.vn";
  const inviteUrl = `${origin}/auth/mobile?ref=${encodeURIComponent(memberCode)}`;

  const templates = {
    formal: `Kính gửi Quý Doanh nhân, tôi là ${memberName} (Mã HV: ${memberCode}). Trân trọng kính mời Anh/Chị gia nhập CLB Doanh nhân CEO 1983 — Hệ sinh thái kết nối giao thương, nâng tầm giá trị và mở rộng cơ hội kinh doanh hàng đầu. Đăng ký tham gia trực tuyến tại: ${inviteUrl}`,
    friendly: `Chào bạn, mình là ${memberName}. Mình đang tham gia CLB Doanh nhân CEO 1983 với cộng đồng doanh nhân rất năng động và nhiều cơ hội hợp tác thiết thực. Thân mời bạn cùng tham gia kết nối tại: ${inviteUrl}`,
  };

  const currentMessage = templates[activeTemplate];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    toast.success("Đã sao chép liên kết giới thiệu!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(currentMessage);
    setCopiedText(true);
    toast.success("Đã sao chép nội dung lời mời!");
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleShareZalo = () => {
    const zaloUrl = `https://zalo.me/share?url=${encodeURIComponent(inviteUrl)}&title=${encodeURIComponent("Lời mời gia nhập CLB Doanh nhân CEO 1983")}`;
    window.open(zaloUrl, "_blank");
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Lời mời gia nhập CLB Doanh nhân CEO 1983",
          text: currentMessage,
          url: inviteUrl,
        });
        return;
      } catch {
        /* fallback */
      }
    }
    handleCopyMessage();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with CEO 1983 Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#00224F] via-[#003B95] to-[#0A192F] p-5 text-white">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-400/20 blur-2xl" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white/90 hover:bg-white/25 hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[15px] font-black tracking-wide text-white uppercase">
                Mời vào CLB CEO 1983
              </h2>
              <p className="text-[11px] font-medium text-amber-300">
                Mở rộng mạng lưới doanh nhân tinh hoa
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* QR Code & Referral Code Card */}
          <div className="flex items-center gap-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3.5 border border-slate-200/80 dark:border-white/10">
            <div className="shrink-0 rounded-xl bg-white p-2 shadow-sm border border-slate-200">
              <QrCanvas value={inviteUrl} size={76} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Mã người giới thiệu
              </div>
              <div className="text-[16px] font-black text-[#003B95] dark:text-amber-400 tracking-wider">
                {memberCode}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                Quét mã QR để mở trang đăng ký gia nhập có gắn mã của bạn.
              </p>
            </div>
          </div>

          {/* Referral Link Box */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
              Liên kết giới thiệu độc quyền
            </label>
            <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-white/5 p-1.5 pl-3 border border-slate-200 dark:border-white/10">
              <span className="text-[11.5px] font-medium text-slate-700 dark:text-slate-300 truncate flex-1 font-mono">
                {inviteUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#003B95] px-3 py-1.5 text-[11.5px] font-bold text-white hover:bg-[#002B70] transition active:scale-95 cursor-pointer shadow-xs"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedLink ? "Đã chép" : "Sao chép"}</span>
              </button>
            </div>
          </div>

          {/* Invitation Message Template Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Lời mời soạn sẵn
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTemplate("formal")}
                  className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition cursor-pointer ${
                    activeTemplate === "formal"
                      ? "bg-[#003B95] text-white"
                      : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Trang trọng
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTemplate("friendly")}
                  className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition cursor-pointer ${
                    activeTemplate === "friendly"
                      ? "bg-[#003B95] text-white"
                      : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Thân mật
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] p-3 border border-slate-200/80 dark:border-white/10 text-[12px] leading-relaxed text-slate-700 dark:text-slate-300">
              {currentMessage}
            </div>
          </div>

          {/* Action Buttons: Zalo / Copy / Share */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyMessage}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 py-2.5 text-[12px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition active:scale-95 cursor-pointer"
            >
              {copiedText ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              <span>{copiedText ? "Đã sao chép" : "Chép lời mời"}</span>
            </button>

            <button
              type="button"
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#003B95] hover:bg-[#002B70] py-2.5 text-[12px] font-bold text-white shadow-md transition active:scale-95 cursor-pointer"
            >
              <Share2 className="h-4 w-4" />
              <span>Gửi lời mời ngay</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
