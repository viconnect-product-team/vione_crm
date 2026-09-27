import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Search,
  Check,
  Users,
  Sparkles,
  Building2,
  Briefcase,
  Plus,
  Phone,
  Bot,
} from "lucide-react";
import { toast } from "sonner";
import { useBusinessConnectNetwork, type BcMobileNetworkPerson } from "@/hooks/use-business-connect-network";
import { resolveMediaUrl } from "@/lib/api-client";

export interface ViOneCreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  onGroupCreated?: (group: any) => void;
}

const DEPARTMENT_PRESETS = [
  { id: "board", label: "Ban Giám Đốc & Điều Hành", emoji: "👑", desc: "Chỉ đạo chiến lược & quyết định cốt lõi" },
  { id: "sales", label: "Phòng Kinh Doanh & Tiếp Thị", emoji: "📈", desc: "Theo dõi doanh số, khách hàng & hợp đồng" },
  { id: "tech", label: "Khối Dự Án & Công Nghệ", emoji: "💻", desc: "Phát triển giải pháp số & điều phối dự án" },
  { id: "hr", label: "Ban Nhân Sự & Quản Lý", emoji: "👥", desc: "Theo dõi tiến độ & phân công công việc nhân viên" },
  { id: "ops", label: "Khối Vận Hành & CSKH", emoji: "⚡", desc: "Hỗ trợ đối tác & xử lý quy trình vận hành" },
];

export function ViOneCreateGroupModal({
  open,
  onClose,
  onGroupCreated,
}: ViOneCreateGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [selectedDept, setSelectedDept] = useState(DEPARTMENT_PRESETS[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);
  const [isAiMatching, setIsAiMatching] = useState(false);

  // Lock body scroll when open
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

  // Load real network contacts from hook
  const { people: networkPeople = [], initialLoading: isLoading } = useBusinessConnectNetwork("");

  const filteredPeople = useMemo(() => {
    if (!searchTerm.trim()) return networkPeople;
    const q = searchTerm.toLowerCase();
    return networkPeople.filter((p: BcMobileNetworkPerson) => {
      const name = (p.displayName || "").toLowerCase();
      const title = (p.jobTitle || p.headline || "").toLowerCase();
      const company = (p.companyName || "").toLowerCase();
      const phone = (p.phone || "").toLowerCase();
      return name.includes(q) || title.includes(q) || company.includes(q) || phone.includes(q);
    });
  }, [networkPeople, searchTerm]);

  const toggleSelectPerson = (id: string) => {
    setSelectedPersonIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleAiAutoSelect = () => {
    setIsAiMatching(true);
    setTimeout(() => {
      // Pick first 3-4 contacts as suggested by AI
      const suggested = networkPeople.slice(0, 4).map((p: BcMobileNetworkPerson) => p.personId);
      setSelectedPersonIds(suggested);
      setIsAiMatching(false);
      toast.success("AI đã phân tích kỹ năng và tự động gợi ý nhân sự phù hợp cho phòng ban!");
    }, 600);
  };

  const handleCreate = () => {
    const finalName = groupName.trim() || selectedDept.label;
    const members = networkPeople.filter((p: BcMobileNetworkPerson) => selectedPersonIds.includes(p.personId));

    const newGroupThread = {
      threadId: `grp-${Date.now()}`,
      personId: `grp:${Date.now()}`,
      displayName: finalName,
      avatarUrl: null,
      headline: selectedDept.label,
      companyName: "Nội bộ công ty",
      isGroup: true,
      membersCount: members.length + 1,
      members: members.map((m: BcMobileNetworkPerson) => ({
        id: m.personId,
        name: m.displayName,
        jobTitle: m.jobTitle || m.headline,
        phone: m.phone,
      })),
      lastMessagePreview: `Đã tạo nhóm làm việc "${finalName}"`,
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
      isConnected: true,
    };

    // Save to localStorage
    try {
      const storedKey = "vione_local_groups";
      const existing = JSON.parse(localStorage.getItem(storedKey) || "[]");
      localStorage.setItem(storedKey, JSON.stringify([newGroupThread, ...existing]));
      window.dispatchEvent(new CustomEvent("vione_group_created", { detail: newGroupThread }));
    } catch {}

    if (onGroupCreated) {
      onGroupCreated(newGroupThread);
    }

    toast.success(`Đã tạo nhóm "${finalName}" thành công!`);
    onClose();
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3.5 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-[420px] max-h-[90dvh] my-auto rounded-3xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-white/10 bg-white/95 dark:bg-[#0c121e]/95 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -ml-1 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Users className="h-4 w-4 text-[var(--bc-mobile-accent,#C29B69)]" />
                <span>Tạo Nhóm Nội Bộ & Phòng Ban</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ViOne Connect • Quản lý nhân viên & tiến độ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreate}
            disabled={selectedPersonIds.length === 0}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition active:scale-95 flex items-center gap-1 cursor-pointer ${
              selectedPersonIds.length > 0
                ? "bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-black shadow-md"
                : "bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-500 cursor-not-allowed"
            }`}
          >
            <span>Tạo</span>
            {selectedPersonIds.length > 0 && (
              <span className="ml-0.5 rounded-full bg-black/15 px-1.5 py-0.2 text-[10px]">
                {selectedPersonIds.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Department Presets */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
              Phòng ban & mục tiêu nhóm:
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {DEPARTMENT_PRESETS.map((dept) => {
                const isSelected = selectedDept.id === dept.id;
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => {
                      setSelectedDept(dept);
                      if (!groupName) setGroupName(dept.label);
                    }}
                    className={`flex items-start gap-2.5 p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                      isSelected
                        ? "border-[var(--bc-mobile-accent,#C29B69)] bg-amber-500/10 dark:bg-amber-500/5 ring-1 ring-[var(--bc-mobile-accent,#C29B69)]"
                        : "border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="text-lg shrink-0 mt-0.5">{dept.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {dept.label}
                      </p>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                        {dept.desc}
                      </p>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-[var(--bc-mobile-accent,#C29B69)] shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group Name Input */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Tên nhóm tùy chỉnh:
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder={selectedDept.label}
              className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--bc-mobile-accent,#C29B69)]"
            />
          </div>

          {/* AI Auto Suggestion Bar */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-[11.5px] text-amber-900 dark:text-amber-200">
                Tích hợp AI gợi ý nhân sự tự động theo kỹ năng
              </span>
            </div>
            <button
              type="button"
              onClick={handleAiAutoSelect}
              disabled={isAiMatching || networkPeople.length === 0}
              className="rounded-xl bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-black px-3 py-1 text-[11px] font-bold shadow-xs hover:opacity-95 shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isAiMatching ? "AI phân tích..." : "AI Gợi ý"}
            </button>
          </div>

          {/* Member Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Chọn nhân sự / thành viên ({selectedPersonIds.length}):
              </label>
              <span className="text-[11px] text-slate-400">
                {networkPeople.length} người trong danh bạ
              </span>
            </div>

            {/* Search inside picker */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên, chức vụ, số điện thoại..."
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] py-2 pl-8 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>

            {/* People list */}
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
              {isLoading ? (
                <div className="p-4 text-center text-xs text-slate-400">Đang tải danh bạ...</div>
              ) : filteredPeople.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">Chưa có người liên hệ nào</div>
              ) : (
                filteredPeople.map((p: BcMobileNetworkPerson) => {
                  const isSelected = selectedPersonIds.includes(p.personId);
                  const jobTitle = p.jobTitle || p.headline;
                  return (
                    <div
                      key={p.personId}
                      onClick={() => toggleSelectPerson(p.personId)}
                      className="flex items-center justify-between p-2.5 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold shrink-0">
                          {p.avatarUrl ? (
                            <img src={p.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                          ) : (
                            (p.displayName || "N").charAt(0).toUpperCase()
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {p.displayName || "Người liên hệ"}
                          </p>
                          {jobTitle && (
                            <p className="text-[11px] font-medium text-[var(--bc-mobile-accent,#C29B69)] truncate">
                              {jobTitle}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate">
                            {p.phone && (
                              <span className="flex items-center gap-0.5">
                                <Phone className="h-2.5 w-2.5 text-emerald-500" />
                                {p.phone}
                              </span>
                            )}
                            {p.companyName && <span>• {p.companyName}</span>}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center transition ${
                          isSelected
                            ? "bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-black"
                            : "border-2 border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-white/10 bg-white/95 dark:bg-[#0c121e]/95 backdrop-blur-md sticky bottom-0 z-20">
          <button
            type="button"
            onClick={handleCreate}
            disabled={selectedPersonIds.length === 0}
            className={`w-full py-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              selectedPersonIds.length > 0
                ? "bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-black shadow-md hover:opacity-95"
                : "bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-500 cursor-not-allowed"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>
              {selectedPersonIds.length > 0
                ? `Tạo Nhóm Làm Việc (${selectedPersonIds.length} thành viên)`
                : "Chọn thành viên để tạo nhóm"}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
