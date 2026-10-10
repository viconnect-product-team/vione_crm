import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Share2, X, Search, Send, Loader2 } from "lucide-react";
import { DirectoryMember, resolveMediaUrl, initialsOf, formatMessagePreview } from "./types";

export interface ForwardMessageModalProps {
  open: boolean;
  onClose: () => void;
  messageText: string;
  members: DirectoryMember[];
  onForward: (targetPeerCode: string, targetName: string) => Promise<void>;
}

export function ForwardMessageModal({
  open,
  onClose,
  messageText,
  members = [],
  onForward,
}: ForwardMessageModalProps) {
  const [q, setQ] = useState("");
  const [forwardingCode, setForwardingCode] = useState<string | null>(null);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  const filtered = (members || []).filter((m) => {
    if (!m) return false;
    const term = q.trim().toLowerCase();
    if (!term) return true;
    return Boolean(
      (m.personName && String(m.personName).toLowerCase().includes(term)) ||
      (m.name && String(m.name).toLowerCase().includes(term)) ||
      (m.code && String(m.code).toLowerCase().includes(term)) ||
      (m.industry && String(m.industry).toLowerCase().includes(term))
    );
  });

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3.5 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[390px] rounded-3xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-white/10 p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Share2 className="h-4.5 w-4.5 text-[#0084FF] dark:text-amber-400" />
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
              Chuyển tiếp tin nhắn
            </h3>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Message preview snippet */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 p-2.5 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 italic border-l-3 border-l-[#0084FF]">
          "{formatMessagePreview(messageText)}"
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm hội viên để chuyển tiếp..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#0084FF]"
          />
        </div>

        {/* Member list */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[220px]">
          {filtered.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-400">Không tìm thấy hội viên phù hợp</p>
          ) : (
            filtered.map((m) => {
              const name = m.personName || m.name;
              const isSending = forwardingCode === m.code;
              return (
                <div
                  key={m.code}
                  className="flex items-center justify-between gap-2.5 rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {m.avatar ? (
                      <img
                        src={resolveMediaUrl(m.avatar) || m.avatar}
                        alt={name}
                        className="h-8 w-8 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-white/10"
                      />
                    ) : (
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-[#003B95] text-white text-[10px] font-bold shrink-0">
                        {initialsOf(name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {name}
                      </p>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                        {m.industry || m.code}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isSending}
                    onClick={async () => {
                      setForwardingCode(m.code);
                      try {
                        await onForward(m.code, name);
                      } finally {
                        setForwardingCode(null);
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-[#0084FF] hover:bg-blue-600 text-white px-3 py-1.5 text-[11px] font-bold shadow-xs active:scale-95 transition cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {isSending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                    <span>Gửi</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
