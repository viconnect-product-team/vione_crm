import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Phone, Mail, MapPin, MessageSquare, X } from "lucide-react";

export function AssociationContactSheet({
  open,
  onClose,
  onOpenChat,
}: {
  open: boolean;
  onClose: () => void;
  onOpenChat?: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[390px] sm:max-w-md rounded-3xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/10 p-5 shadow-2xl text-slate-900 dark:text-white flex flex-col gap-4 animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white leading-tight">
                Liên Hệ Ban Thư Ký
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                CLB Doanh Nhân CEO 1983
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contact Options */}
        <div className="space-y-2.5">
          {/* Hotline */}
          <a
            href="tel:0983191983"
            className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3.5 hover:border-amber-500/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Hotline Trực Ban</p>
                <p className="text-[14px] font-bold text-slate-900 dark:text-white group-hover:text-[#003B95] dark:group-hover:text-amber-400 transition-colors">
                  0983 19 1983
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold px-3 py-1">
              Gọi ngay
            </span>
          </a>

          {/* Email */}
          <a
            href="mailto:banthuky@ceo1983.vn"
            className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3.5 hover:border-amber-500/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Email Ban Thư Ký</p>
                <p className="text-[13px] font-bold text-slate-900 dark:text-white group-hover:text-[#003B95] dark:group-hover:text-amber-400 transition-colors">
                  banthuky@ceo1983.vn
                </p>
              </div>
            </div>
            <span className="rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-bold px-3 py-1">
              Gửi thư
            </span>
          </a>

          {/* Office Address */}
          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Văn Phòng Trụ Sở</p>
              <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                Tòa nhà CEO 1983, Duy Tân, Cầu Giấy, Hà Nội
              </p>
            </div>
          </div>
        </div>

        {/* In-app Chat Button */}
        <button
          type="button"
          onClick={() => {
            onClose();
            if (onOpenChat) onOpenChat();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#003B95] hover:bg-[#002B70] py-3 text-[13px] font-bold text-white shadow-md shadow-blue-900/20 active:scale-[0.98] transition-all cursor-pointer mt-1"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Nhắn tin trực tiếp trong ứng dụng</span>
        </button>
      </div>
    </div>,
    document.body
  );
}

