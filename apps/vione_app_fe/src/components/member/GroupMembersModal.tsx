import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Users, Shield, Phone, MessageSquare, ExternalLink } from "lucide-react";
import type { MyConversation, DirectoryMember } from "@/lib/member-app.functions";
import { resolveMediaUrl } from "@/lib/api-client";

export interface GroupMembersModalProps {
  open: boolean;
  onClose: () => void;
  group: MyConversation;
  allMembers?: DirectoryMember[];
  onSelectMember?: (member: DirectoryMember) => void;
}

function initialsOf(name?: string): string {
  if (!name) return "G";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function GroupMembersModal({
  open,
  onClose,
  group,
  allMembers = [],
  onSelectMember,
}: GroupMembersModalProps) {
  const groupMembers = group.members || [];
  const memberCount = group.memberCount || groupMembers.length + 1;

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3.5 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-[390px] my-auto rounded-3xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85dvh] text-slate-900 dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-[#003B95] dark:text-amber-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                Thành viên nhóm ({memberCount})
              </h3>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                {group.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Members List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 dark:divide-white/5">
          {/* Creator / Self */}
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                Bạn
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Bạn (Người tạo nhóm)
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    Trưởng nhóm
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                  Hội viên CLB CEO 1983
                </p>
              </div>
            </div>
          </div>

          {/* Other Group Members */}
          {groupMembers.map((m, idx) => {
            const resolvedAvatar = m.avatarUrl ? resolveMediaUrl(m.avatarUrl) : null;
            const dirMem = allMembers.find(
              (dm) => dm.code.toLowerCase() === (m.code || "").toLowerCase()
            );

            return (
              <div
                key={m.code || idx}
                onClick={() => {
                  if (dirMem && onSelectMember) {
                    onSelectMember(dirMem);
                    onClose();
                  }
                }}
                className="flex items-center justify-between py-2.5 group hover:bg-slate-50 dark:hover:bg-white/[0.03] px-1 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                  <div className="relative shrink-0">
                    {resolvedAvatar ? (
                      <img
                        src={resolvedAvatar}
                        alt={m.name}
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 dark:ring-white/10"
                      />
                    ) : (
                      <div className="grid w-10 h-10 place-items-center rounded-full bg-gradient-to-tr from-[#003B95] to-[#1E40AF] text-amber-300 text-xs font-bold ring-1 ring-slate-200 dark:ring-white/10">
                        {initialsOf(m.name)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {m.name}
                      </span>
                      {m.code && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                          {m.code}
                        </span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                      {m.role || "Thành viên nhóm"}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-slate-400 group-hover:text-[#003B95] dark:group-hover:text-amber-400">
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-white/10 hover:bg-slate-300 text-slate-700 dark:text-slate-300 transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
