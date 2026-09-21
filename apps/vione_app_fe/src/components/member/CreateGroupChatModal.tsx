import React, { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Search,
  Check,
  Camera,
  Users,
  Sparkles,
  Building2,
  Briefcase,
  ChevronRight,
  Plus,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import type { DirectoryMember, MyConversation } from "@/lib/member-app.functions";
import { resolveMediaUrl } from "@/lib/api-client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { isSelfUser } from "@/routes/association.messages";

export interface CreateGroupChatModalProps {
  open: boolean;
  onClose: () => void;
  members: DirectoryMember[];
  onCreateGroup?: (group: MyConversation, initialMsg: string) => void;
  onGroupCreated?: (group: MyConversation) => void;
}

const PRESET_GROUP_ICONS = [
  { id: "business", label: "Giao thương", emoji: "💼", color: "from-blue-600 to-indigo-700" },
  { id: "handshake", label: "Kết nối", emoji: "🤝", color: "from-amber-500 to-orange-600" },
  { id: "trophy", label: "Vinh danh", emoji: "🏆", color: "from-yellow-500 to-amber-600" },
  { id: "rocket", label: "Bứt phá", emoji: "🚀", color: "from-rose-500 to-pink-600" },
  { id: "diamond", label: "VIP Pass", emoji: "💎", color: "from-cyan-500 to-blue-600" },
  { id: "landmark", label: "Hội đồng", emoji: "🏛️", color: "from-emerald-600 to-teal-700" },
  { id: "lightning", label: "Tiên phong", emoji: "⚡", color: "from-amber-400 to-yellow-500" },
  { id: "target", label: "Chiến lược", emoji: "🎯", color: "from-purple-600 to-indigo-800" },
];

const PRESET_GROUP_NAMES = [
  "Ban Điều Hành CEO 1983",
  "Liên Minh Giao Thương B2B",
  "Xúc Tiến Đầu Tư & Dự Án",
  "CLB Golf Doanh Nhân 1983",
  "Hợp Tác Đổi Mới Công Nghệ",
  "Chuỗi Cung Ứng Nội Bộ 1983",
];

function initialsOf(name?: string): string {
  if (!name) return "G";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CreateGroupChatModal({
  open,
  onClose,
  members,
  onCreateGroup,
  onGroupCreated,
}: CreateGroupChatModalProps) {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState("");
  const [selectedBadge, setSelectedBadge] = useState(PRESET_GROUP_ICONS[0]);
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<DirectoryMember[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lock body scroll when modal is open to ensure 100% stable centering on mobile
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

  const [myMember, setMyMember] = useState<{ code?: string; id?: string; name?: string } | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(localStorage.getItem("vba_custom_profile") || "null");
    } catch {
      return null;
    }
  });

  const connectedMemberCodes = useMemo(() => {
    if (typeof window === "undefined") return new Set<string>();
    try {
      const stored = JSON.parse(localStorage.getItem("vba_connected_members") || "[]");
      if (Array.isArray(stored)) {
        return new Set(stored.map((s: string) => String(s).toLowerCase()));
      }
    } catch {}
    return new Set<string>();
  }, [open]);

  const isMemberConnected = (m: DirectoryMember) => {
    if (isSelfUser(m, user, myMember)) return false;
    if ((m as any).isConnected || (m as any).connected || (m as any).isFriend) return true;
    const mCode = (m.code || "").toLowerCase();
    const mUserId = (m.userId || "").toLowerCase();
    if (connectedMemberCodes.has(mCode) || (mUserId && connectedMemberCodes.has(mUserId))) return true;
    return false;
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerHaptic = () => {
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(15);
      }
    } catch {}
  };

  const toggleSelectMember = (member: DirectoryMember) => {
    triggerHaptic();
    setSelectedMembers((prev) => {
      const exists = prev.some((m) => m.code.toLowerCase() === member.code.toLowerCase());
      if (exists) {
        return prev.filter((m) => m.code.toLowerCase() !== member.code.toLowerCase());
      } else {
        return [...prev, member];
      }
    });
  };

  const removeSelectedMember = (memberCode: string) => {
    triggerHaptic();
    setSelectedMembers((prev) =>
      prev.filter((m) => m.code.toLowerCase() !== memberCode.toLowerCase())
    );
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomAvatarUrl(url);
    toast.success("Đã chọn ảnh đại diện cho nhóm!");
  };

  const filteredMembers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    // Strictly only connected members, excluding self
    const connectedOnly = members.filter((m) => isMemberConnected(m));

    if (!q) return connectedOnly;
    return connectedOnly.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        (m.company && m.company.toLowerCase().includes(q)) ||
        (m.industry && m.industry.toLowerCase().includes(q)) ||
        (m.personTitle && m.personTitle.toLowerCase().includes(q))
    );
  }, [members, searchTerm, connectedMemberCodes, user, myMember]);

  const handleCreate = () => {
    if (selectedMembers.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 hội viên để tạo nhóm!");
      return;
    }

    setIsSubmitting(true);

    try {
      const groupId = `group_${Date.now()}`;
      const defaultName =
        groupName.trim() ||
        `Nhóm ${selectedMembers
          .slice(0, 3)
          .map((m) => m.name.split(" ").pop())
          .join(", ")}${selectedMembers.length > 3 ? ` và +${selectedMembers.length - 3}` : ""}`;

      const avatar = customAvatarUrl || null;
      const groupEmoji = customAvatarUrl ? null : selectedBadge.emoji;

      const newGroup: MyConversation = {
        peerCode: groupId,
        name: defaultName,
        last: `Bạn đã tạo nhóm với ${selectedMembers.length} thành viên`,
        time: new Date().toISOString(),
        rawTime: new Date().toISOString(),
        unread: 0,
        avatarUrl: avatar,
        isGroup: true,
        memberCount: selectedMembers.length + 1, // Bao gồm cả người tạo
        groupAvatar: groupEmoji || undefined,
        members: selectedMembers.map((m) => ({
          id: (m as any).userId || m.code,
          name: m.name,
          avatarUrl: m.avatar,
          code: m.code,
          role: m.personTitle || "Hội viên CEO 1983",
        })),
      };

      const introMsg = `[system] 🎉 Chào mừng quý Anh/Chị đến với nhóm chat "${defaultName}"! Nhóm gồm ${newGroup.memberCount} thành viên thuộc CLB Doanh Nhân CEO 1983.`;

      if (onCreateGroup) {
        onCreateGroup(newGroup, introMsg);
      }
      if (onGroupCreated) {
        onGroupCreated(newGroup);
      }
      toast.success(`Đã tạo nhóm "${defaultName}" thành công!`);
      onClose();
    } catch {
      toast.error("Không thể tạo nhóm. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3.5 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-[400px] sm:max-w-lg max-h-[86dvh] my-auto rounded-3xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-white">
        {/* Top Header - Facebook Messenger Style */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-white/10 bg-white/95 dark:bg-[#0c121e]/95 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -ml-1 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition active:scale-95 cursor-pointer"
              title="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
            <div>
              <h3 className="text-[15px] font-black text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                <Users className="h-4 w-4 text-[#003B95] dark:text-amber-400" />
                <span>Tạo nhóm chat mới</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                CLB Doanh Nhân CEO 1983 • HanoiBA
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreate}
            disabled={selectedMembers.length === 0 || isSubmitting}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition active:scale-95 flex items-center gap-1 cursor-pointer ${
              selectedMembers.length > 0
                ? "bg-gradient-to-r from-[#003B95] to-[#1E40AF] text-white shadow-md shadow-blue-900/20 hover:brightness-110"
                : "bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-500 cursor-not-allowed"
            }`}
          >
            <span>Tạo</span>
            {selectedMembers.length > 0 && (
              <span className="ml-0.5 rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
                {selectedMembers.length}
              </span>
            )}
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Section 1: Group Profile (Avatar & Name) */}
          <div className="rounded-2xl p-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 space-y-3.5">
            <div className="flex items-center gap-3.5">
              {/* Group Avatar Preview & Picker */}
              <div className="relative shrink-0">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-md border-2 border-white dark:border-slate-800 cursor-pointer overflow-hidden group transition-transform active:scale-95 ${
                    customAvatarUrl
                      ? "bg-slate-100"
                      : `bg-gradient-to-tr ${selectedBadge.color}`
                  }`}
                  title="Nhấn để đổi ảnh nhóm"
                >
                  {customAvatarUrl ? (
                    <img
                      src={customAvatarUrl}
                      alt="Avatar nhóm"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl drop-shadow-sm group-hover:scale-110 transition-transform">
                      {selectedBadge.emoji}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white dark:bg-slate-800 text-[#003B95] dark:text-amber-400 shadow-md border border-slate-200 dark:border-slate-700 active:scale-90 transition cursor-pointer"
                  title="Tải ảnh từ máy"
                >
                  <Camera className="h-3 w-3" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileUpload}
                  className="hidden"
                />
              </div>

              {/* Group Name Input */}
              <div className="flex-1 min-w-0">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Tên nhóm chat
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Ví dụ: Ban Điều Hành CEO 1983..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.05] text-[13px] font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#003B95] dark:focus:border-amber-400 shadow-xs pr-8"
                  />
                  {groupName && (
                    <button
                      type="button"
                      onClick={() => setGroupName("")}
                      className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Badge Icons Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Chọn biểu tượng đại diện nhóm
                </span>
                {customAvatarUrl && (
                  <button
                    type="button"
                    onClick={() => setCustomAvatarUrl(null)}
                    className="text-[10.5px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    Dùng lại biểu tượng
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                {PRESET_GROUP_ICONS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setCustomAvatarUrl(null);
                      setSelectedBadge(b);
                    }}
                    className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      !customAvatarUrl && selectedBadge.id === b.id
                        ? "bg-[#003B95] text-white shadow-xs scale-105"
                        : "bg-white dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                    }`}
                  >
                    <span>{b.emoji}</span>
                    <span className="text-[11px]">{b.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Name Suggestions Chips */}
            <div>
              <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                Gợi ý tên nhóm nhanh
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_GROUP_NAMES.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setGroupName(name);
                    }}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-[#003B95] dark:hover:text-amber-400 hover:border-[#003B95]/40 transition cursor-pointer"
                  >
                    + {name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Selected Members Horizontal Carousel (Messenger UX) */}
          {selectedMembers.length > 0 && (
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <span>Đã chọn</span>
                  <span className="text-[#003B95] dark:text-amber-400">
                    ({selectedMembers.length})
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedMembers([])}
                  className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-red-500 cursor-pointer"
                >
                  Xóa tất cả
                </button>
              </div>

              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                {selectedMembers.map((m) => {
                  const resolvedAvatar = m.avatar ? resolveMediaUrl(m.avatar) : null;
                  const firstName = m.name.split(" ").pop() || m.name;
                  return (
                    <div
                      key={m.code}
                      className="relative shrink-0 flex flex-col items-center gap-1 w-14 group animate-in zoom-in duration-150"
                    >
                      <div className="relative">
                        {resolvedAvatar ? (
                          <img
                            src={resolvedAvatar}
                            alt={m.name}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-[#003B95] dark:ring-amber-400 shadow-xs"
                          />
                        ) : (
                          <div className="grid w-12 h-12 place-items-center rounded-full bg-gradient-to-tr from-[#003B95] to-[#1E40AF] text-amber-300 text-xs font-bold ring-2 ring-[#003B95] dark:ring-amber-400 shadow-xs">
                            {initialsOf(m.name)}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeSelectedMember(m.code)}
                          className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center shadow-md active:scale-90 transition cursor-pointer"
                          title="Gỡ khỏi nhóm"
                        >
                          <X className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[54px] text-center">
                        {firstName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: Search Bar */}
          <div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.05] px-3.5 py-2.5 text-[13px]">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm hội viên theo tên, mã số, công ty..."
                className="flex-1 bg-transparent text-[13px] border-none outline-none ring-0 focus:outline-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Section Indicator: Connected Members Only */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-[#003B95] dark:text-amber-400">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Hội viên đã kết nối giao thương ({filteredMembers.length})</span>
            </div>
            <span className="text-[10px] text-slate-400">Chỉ người đã kết nối</span>
          </div>

          {/* Section 4: Members List with Messenger-style Circle Checkbox */}
          <div className="divide-y divide-slate-100 dark:divide-white/5 border-t border-slate-100 dark:border-white/5 pt-1">
            {filteredMembers.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">Không tìm thấy hội viên phù hợp</p>
              </div>
            ) : (
              filteredMembers.map((m) => {
                const isSelected = selectedMembers.some(
                  (sel) => sel.code.toLowerCase() === m.code.toLowerCase()
                );
                const resolvedAvatar = m.avatar ? resolveMediaUrl(m.avatar) : null;

                return (
                  <div
                    key={m.code}
                    onClick={() => toggleSelectMember(m)}
                    className="flex items-center justify-between py-2.5 px-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer select-none group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {resolvedAvatar ? (
                          <img
                            src={resolvedAvatar}
                            alt={m.name}
                            className="w-11 h-11 rounded-full object-cover ring-1 ring-slate-200 dark:ring-white/10"
                          />
                        ) : (
                          <div className="grid w-11 h-11 place-items-center rounded-full bg-gradient-to-tr from-[#003B95] to-[#1E40AF] text-amber-300 text-xs font-bold ring-1 ring-slate-200 dark:ring-white/10">
                            {initialsOf(m.name)}
                          </div>
                        )}
                        {Boolean((m as any).isOnline) && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0c121e]" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13.5px] font-bold text-slate-900 dark:text-white truncate">
                            {m.name}
                          </span>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                            {m.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {m.personTitle || m.company || m.industry || "Hội viên CEO 1983"}
                        </p>
                      </div>
                    </div>

                    {/* Messenger Checkbox Circle */}
                    <div className="shrink-0 pl-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-[#003B95] dark:bg-amber-500 text-white shadow-xs scale-105"
                            : "border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-transparent group-hover:border-slate-400"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sticky Bottom Action Bar on Mobile */}
        <div className="p-3 border-t border-slate-100 dark:border-white/10 bg-white/95 dark:bg-[#0c121e]/95 backdrop-blur-md sticky bottom-0 z-20">
          <button
            type="button"
            onClick={handleCreate}
            disabled={selectedMembers.length === 0 || isSubmitting}
            className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-98 shadow-md flex items-center justify-center gap-2 cursor-pointer ${
              selectedMembers.length > 0
                ? "bg-gradient-to-r from-[#003B95] via-[#1E40AF] to-[#D97706] text-white shadow-blue-900/20 hover:brightness-105"
                : "bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-500 cursor-not-allowed"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>
              {selectedMembers.length > 0
                ? `Tạo nhóm chat (${selectedMembers.length} thành viên)`
                : "Chọn thành viên để tạo nhóm"}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
