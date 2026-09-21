import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import {
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  ExternalLink,
  MessageSquare,
  UserPlus,
  BadgeCheck,
  User,
  Check,
  UserMinus,
  CreditCard,
} from "lucide-react";
import { resolveMediaUrl } from "@/lib/api-client";
import { toast } from "sonner";
import type { DirectoryMember } from "@/lib/member-app.functions";

export interface MemberProfileModalProps {
  member: DirectoryMember | null;
  initialConnected?: boolean;
  onClose: () => void;
  onMessage?: (member: DirectoryMember) => void;
  onConnect?: (member: DirectoryMember) => void;
  onDisconnect?: (member: DirectoryMember) => void;
}

export function MemberProfileModal({
  member,
  initialConnected,
  onClose,
  onMessage,
  onConnect,
  onDisconnect,
}: MemberProfileModalProps) {
  const [mounted, setMounted] = useState(false);
  const isDisconnectedInStorage = (m: DirectoryMember | null) => {
    if (!m) return false;
    try {
      const raw = localStorage.getItem("vba.disconnected_members");
      if (raw) {
        const list: string[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          const keys = [m.code, m.userId].filter(Boolean).map((x) => String(x).toLowerCase());
          return list.some((item) => keys.includes(String(item).toLowerCase()));
        }
      }
    } catch {}
    return false;
  };

  const isConnectedInStorage = (m: DirectoryMember | null) => {
    if (!m) return false;
    try {
      const raw = localStorage.getItem("vba.connected_members");
      if (raw) {
        const list: string[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          const keys = [m.code, m.userId].filter(Boolean).map((x) => String(x).toLowerCase());
          return list.some((item) => keys.includes(String(item).toLowerCase()));
        }
      }
    } catch {}
    return false;
  };

  const [connected, setConnected] = useState(() => {
    if (!member) return false;
    if (isDisconnectedInStorage(member)) return false;
    if (isConnectedInStorage(member)) return true;
    if (initialConnected !== undefined) return initialConnected;
    return false;
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Kiểm tra trạng thái đã kết nối đồng bộ
  useEffect(() => {
    if (!member) return;
    if (isDisconnectedInStorage(member)) {
      setConnected(false);
      return;
    }
    if (isConnectedInStorage(member)) {
      setConnected(true);
      return;
    }
    if (initialConnected !== undefined) {
      setConnected(initialConnected);
      return;
    }
    setConnected(false);
  }, [member?.code, member?.userId, initialConnected]);

  if (!mounted || !member || typeof document === "undefined") {
    return null;
  }

  const displayName = member.contact || member.personName || member.name;
  const avatarUrl = member.avatar ? resolveMediaUrl(member.avatar) || member.avatar : null;
  const subtitle = [member.personTitle || member.industry, member.region].filter(Boolean).join(" · ");

  const handleToggleConnection = () => {
    const mCode = member.code.toLowerCase();
    const mUserId = (member.userId || "").toLowerCase();

    if (connected) {
      // HỦY KẾT NỐI
      try {
        // 1. Lưu vào danh sách ngắt kết nối
        const storedD = localStorage.getItem("vba.disconnected_members");
        const dList: string[] = storedD ? JSON.parse(storedD) : [];
        if (!dList.includes(mCode)) dList.push(mCode);
        if (mUserId && !dList.includes(mUserId)) dList.push(mUserId);
        localStorage.setItem("vba.disconnected_members", JSON.stringify(dList));

        // 2. Xóa khỏi danh sách đã kết nối
        const storedC = localStorage.getItem("vba.connected_members");
        const cList: string[] = storedC ? JSON.parse(storedC) : [];
        const nextC = cList.filter((c) => {
          const lower = String(c).toLowerCase();
          return lower !== mCode && lower !== mUserId;
        });
        localStorage.setItem("vba.connected_members", JSON.stringify(nextC));

        // 3. Bắn event toàn hệ thống
        window.dispatchEvent(
          new CustomEvent("vba.connection.changed", {
            detail: { memberCode: member.code, userId: member.userId, connected: false },
          }),
        );
      } catch {}

      setConnected(false);
      toast.success(`Đã hủy kết nối với hội viên ${displayName}`);
      if (onDisconnect) onDisconnect(member);
      return;
    }

    // GẮN KẾT / KẾT NỐI
    try {
      // 1. Xóa khỏi danh sách ngắt kết nối
      const storedD = localStorage.getItem("vba.disconnected_members");
      const dList: string[] = storedD ? JSON.parse(storedD) : [];
      const nextD = dList.filter((c) => {
        const lower = String(c).toLowerCase();
        return lower !== mCode && lower !== mUserId;
      });
      localStorage.setItem("vba.disconnected_members", JSON.stringify(nextD));

      // 2. Lưu vào danh sách đã kết nối
      const storedC = localStorage.getItem("vba.connected_members");
      const cList: string[] = storedC ? JSON.parse(storedC) : [];
      if (!cList.includes(mCode)) cList.push(mCode);
      if (mUserId && !cList.includes(mUserId)) cList.push(mUserId);
      localStorage.setItem("vba.connected_members", JSON.stringify(cList));

      // 3. Bắn event toàn hệ thống
      window.dispatchEvent(
        new CustomEvent("vba.connection.changed", {
          detail: { memberCode: member.code, userId: member.userId, connected: true },
        }),
      );
    } catch {}

    setConnected(true);
    toast.success(`Đã gửi yêu cầu kết nối tới hội viên ${displayName}`);
    if (onConnect) onConnect(member);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] grid place-items-center w-full h-[100dvh] min-h-[100dvh] p-3.5 sm:p-4 my-auto overflow-y-auto bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="my-auto relative flex flex-col w-full max-w-[400px] max-h-[90dvh] rounded-3xl bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#003B95] dark:text-amber-400">
            HỒ SƠ HỘI VIÊN CLB CEO 1983
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Scrollable Center Content with Compact / Narrow Width */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 w-full max-w-[360px] mx-auto space-y-3.5 [scrollbar-width:thin]">
          {/* Profile Avatar & Names */}
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-14 w-14 rounded-2xl object-cover ring-2 ring-amber-500/40 shadow-sm"
                  onError={(e) => {
                    e.currentTarget.src = "/ceo1983-logo.png";
                  }}
                />
              ) : (
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-[#003B95] dark:text-amber-400 ring-2 ring-amber-500/30">
                  <User className="h-7 w-7" />
                </div>
              )}
              {member.verified && (
                <BadgeCheck className="absolute -bottom-1 -right-1 h-4.5 w-4.5 text-amber-500 fill-white dark:fill-slate-900" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="truncate text-[15px] font-extrabold text-slate-900 dark:text-white">
                  {displayName}
                </h3>
                {member.code && (
                  <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[9.5px] font-bold text-[#003B95] dark:text-amber-400 shrink-0">
                    {member.code}
                  </span>
                )}
              </div>
              {member.name && (
                <p className="truncate text-[12px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-[#003B95] dark:text-amber-400 shrink-0" />
                  <span>{member.name}</span>
                </p>
              )}
              {subtitle && (
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Giới thiệu / Bio nếu có */}
          {member.about && (
            <div className="rounded-2xl bg-slate-50 dark:bg-white/[0.03] p-2.5 text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed border border-slate-200/60 dark:border-white/5">
              <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">
                GIỚI THIỆU
              </p>
              <p className="line-clamp-4 whitespace-pre-wrap">{member.about}</p>
            </div>
          )}

          {/* Thông tin liên lạc (Contact List) */}
          <div className="space-y-1.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] p-2.5 text-[11.5px] border border-slate-200/60 dark:border-white/5">
            {member.phone && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Phone className="h-3.5 w-3.5 text-[#003B95] dark:text-amber-400" />
                  <span>Điện thoại</span>
                </div>
                <a
                  href={`tel:${member.phone}`}
                  className="font-semibold text-[#003B95] dark:text-amber-400 hover:underline"
                >
                  {member.phone}
                </a>
              </div>
            )}
            {member.email && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Mail className="h-3.5 w-3.5 text-[#003B95] dark:text-amber-400" />
                  <span>Email</span>
                </div>
                <a
                  href={`mailto:${member.email}`}
                  className="font-semibold text-[#003B95] dark:text-amber-400 hover:underline truncate max-w-[190px]"
                >
                  {member.email}
                </a>
              </div>
            )}
            {member.address && (
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 shrink-0">
                  <MapPin className="h-3.5 w-3.5 text-[#003B95] dark:text-amber-400" />
                  <span>Địa chỉ</span>
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-300 text-right truncate max-w-[200px]">
                  {member.address}
                </span>
              </div>
            )}
            {member.website && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Globe className="h-3.5 w-3.5 text-[#003B95] dark:text-amber-400" />
                  <span>Website</span>
                </div>
                <a
                  href={member.website.startsWith("http") ? member.website : `https://${member.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#003B95] dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <span>Truy cập</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer with Action Buttons */}
        <div className="shrink-0 px-4 py-3 border-t border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03]">
          {/* 2 Nút hành động: "Xem danh thiếp số" & "Kết nối ngay / Hủy kết nối" */}
          <div className="flex gap-2">
            <Link
              to="/card/$code"
              params={{ code: member.code || "M1983-001" }}
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 py-2.5 text-[12.5px] font-bold text-[#003B95] dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition active:scale-95 cursor-pointer shadow-sm text-center"
            >
              <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>Xem danh thiếp số</span>
            </Link>

            <button
              type="button"
              onClick={handleToggleConnection}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12.5px] font-bold transition active:scale-95 cursor-pointer shadow-md ${
                connected
                  ? "border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 shadow-rose-500/10"
                  : "bg-[#003B95] hover:bg-[#002B70] text-white shadow-blue-900/20"
              }`}
            >
              {connected ? (
                <>
                  <UserMinus className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  <span>Hủy kết nối</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 text-white" />
                  <span>Kết nối</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
