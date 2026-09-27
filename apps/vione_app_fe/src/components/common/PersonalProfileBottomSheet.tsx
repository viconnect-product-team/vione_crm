import React, { useState } from "react";
import {
  X,
  Phone,
  Mail,
  MapPin,
  Building2,
  Briefcase,
  Globe,
  Share2,
  Pencil,
  BadgeCheck,
  ExternalLink,
  Copy,
  Check,
  MessageCircle,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { resolveMediaUrl } from "@/lib/api-client";

export interface PersonalProfileData {
  displayName: string;
  jobTitle?: string | null;
  companyName?: string | null;
  companyLogo?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  bio?: string | null;
  facebookUrl?: string | null;
  zaloPhone?: string | null;
  linkedinUrl?: string | null;
  website?: string | null;
  memberCode?: string | null;
  isOwner?: boolean;
}

interface PersonalProfileBottomSheetProps {
  open: boolean;
  onClose: () => void;
  profile: PersonalProfileData;
  onEdit?: () => void;
  onOpenQr?: () => void;
}

export function PersonalProfileBottomSheet({
  open,
  onClose,
  profile,
  onEdit,
  onOpenQr,
}: PersonalProfileBottomSheetProps) {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!open) return null;

  const initials = profile.displayName
    ? profile.displayName
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .slice(-2)
        .join("")
        .toUpperCase()
    : "VO";

  const resolvedAvatar = profile.avatarUrl
    ? resolveMediaUrl(profile.avatarUrl) || profile.avatarUrl
    : null;

  const resolvedCover = profile.coverUrl
    ? resolveMediaUrl(profile.coverUrl) || profile.coverUrl
    : null;

  const handleCopyPhone = () => {
    if (!profile.phone) return;
    navigator.clipboard.writeText(profile.phone);
    setCopiedPhone(true);
    toast.success("Đã sao chép số điện thoại!");
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.displayName} — Danh thiếp số ViOne`,
          text: `${profile.displayName} • ${profile.jobTitle || "Doanh nhân"} tại ${profile.companyName || "ViOne"}`,
          url,
        });
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") return;
      }
    }
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Đã sao chép liên kết danh thiếp!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Chuẩn hoá link Facebook để luôn mở được hợp lệ
  const formatFacebookUrl = (link?: string | null) => {
    if (!link || !link.trim()) return null;
    const clean = link.trim();
    if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
    return `https://${clean}`;
  };

  const facebookUrl = formatFacebookUrl(profile.facebookUrl);
  const zaloUrl = profile.phone
    ? `https://zalo.me/${profile.phone.replace(/[^0-9]/g, "")}`
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm p-0 transition-opacity duration-300 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-[32px] border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0A1224] text-slate-900 dark:text-white shadow-2xl transition-transform duration-300 ease-out animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="sticky top-0 z-30 flex justify-center pt-3 pb-1 bg-inherit">
          <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-4 right-4 z-30 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition active:scale-95 cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Ảnh bìa Cover */}
        <div className="relative h-32 sm:h-36 w-full overflow-hidden bg-gradient-to-r from-[#001D4A] via-[#003B95] to-[#0A1224]">
          {resolvedCover ? (
            <img
              src={resolvedCover}
              alt="Cover Photo"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-tr from-[#00224F] via-[#003B95] to-[#0A1224]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Huy hiệu thành viên góc bìa */}
          <div className="absolute top-3 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10.5px] font-bold shadow-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{profile.memberCode || "HỘI VIÊN CHÍNH THỨC"}</span>
          </div>
        </div>

        {/* Nội dung hồ sơ cá nhân */}
        <div className="px-5 pb-8 pt-0">
          {/* Avatar + Quick Action Row */}
          <div className="flex items-end justify-between -mt-12 mb-3">
            <div className="relative">
              {resolvedAvatar ? (
                <img
                  src={resolvedAvatar}
                  alt={profile.displayName}
                  className="h-24 w-24 rounded-2xl border-4 border-white dark:border-[#0A1224] object-cover shadow-xl bg-white dark:bg-slate-800"
                />
              ) : (
                <div className="h-24 w-24 rounded-2xl border-4 border-white dark:border-[#0A1224] bg-gradient-to-tr from-[#003B95] to-[#19194D] text-white font-black text-2xl grid place-items-center shadow-xl">
                  {initials}
                </div>
              )}
              <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0A1224]" />
            </div>

            {/* Cụm nút hành động nhanh bên phải avatar */}
            <div className="flex items-center gap-2 mb-1">
              {onOpenQr && (
                <button
                  type="button"
                  onClick={onOpenQr}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[#003B95] dark:text-blue-400 hover:bg-slate-100 transition active:scale-95 shadow-xs cursor-pointer"
                  title="Mở mã QR danh thiếp"
                >
                  <QrCode className="h-5 w-5" />
                </button>
              )}

              <button
                type="button"
                onClick={handleShare}
                className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition active:scale-95 shadow-xs cursor-pointer"
                title="Chia sẻ hồ sơ"
              >
                {copiedLink ? <Check className="h-5 w-5 text-emerald-500" /> : <Share2 className="h-5 w-5" />}
              </button>

              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  title="Chỉnh sửa hồ sơ"
                  aria-label="Chỉnh sửa hồ sơ"
                  className="grid h-10 w-10 place-items-center rounded-xl bg-[#003B95] hover:bg-[#002b6e] text-white shadow-md hover:brightness-105 active:scale-95 transition cursor-pointer"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Tên & Chức danh */}
          <div className="space-y-1 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                {profile.displayName || "Doanh nhân"}
              </h2>
              <BadgeCheck className="h-5 w-5 text-[#003B95] dark:text-sky-400 shrink-0" />
            </div>

            {profile.jobTitle && (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Briefcase className="h-3.5 w-3.5 text-[#003B95] dark:text-blue-400 shrink-0" />
                <span>{profile.jobTitle}</span>
              </div>
            )}

            {profile.companyName && (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{profile.companyName}</span>
              </div>
            )}
          </div>

          {/* Giới thiệu bản thân (Bio) */}
          {profile.bio && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                Giới thiệu & Triết lý kinh doanh:
              </span>
              {profile.bio}
            </div>
          )}

          {/* Hàng nút kết nối trực tiếp (Call / Zalo / Email) */}
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {profile.phone ? (
              <a
                href={`tel:${profile.phone}`}
                className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition hover:bg-emerald-100 dark:hover:bg-emerald-900/40 active:scale-95"
              >
                <div className="h-8 w-8 rounded-full bg-emerald-500 text-white grid place-items-center shadow-xs">
                  <Phone className="h-4 w-4" />
                </div>
                <span>Gọi điện</span>
              </a>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-slate-100 dark:bg-slate-800/40 opacity-40 text-xs font-medium">
                <Phone className="h-5 w-5 text-slate-400" />
                <span>Chưa có SĐT</span>
              </div>
            )}

            {zaloUrl ? (
              <a
                href={zaloUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 font-bold text-xs transition hover:bg-blue-100 dark:hover:bg-blue-900/40 active:scale-95"
              >
                <div className="h-8 w-8 rounded-full bg-[#0068FF] text-white grid place-items-center shadow-xs font-black text-xs">
                  Z
                </div>
                <span>Nhắn Zalo</span>
              </a>
            ) : null}

            {profile.email ? (
              <a
                href={`mailto:${profile.email}`}
                className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 font-bold text-xs transition hover:bg-amber-100 dark:hover:bg-amber-900/40 active:scale-95"
              >
                <div className="h-8 w-8 rounded-full bg-amber-500 text-white grid place-items-center shadow-xs">
                  <Mail className="h-4 w-4" />
                </div>
                <span>Gửi Email</span>
              </a>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-slate-100 dark:bg-slate-800/40 opacity-40 text-xs font-medium">
                <Mail className="h-5 w-5 text-slate-400" />
                <span>Chưa có Email</span>
              </div>
            )}
          </div>

          {/* Danh mục Liên kết mạng xã hội & Kênh cá nhân (Facebook, LinkedIn, Website, Địa chỉ) */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Liên kết cá nhân & Mạng xã hội
            </h3>

            {/* Facebook */}
            {facebookUrl ? (
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-blue-400 dark:hover:border-blue-500 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-[#1877F2] text-white grid place-items-center shadow-sm">
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-blue-600 transition-colors">
                      Trang Facebook cá nhân
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px] block">
                      {facebookUrl.replace(/^https?:\/\/(www\.)?/, "")}
                    </span>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </a>
            ) : (
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 text-xs">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 grid place-items-center">
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <span>Chưa cập nhật liên kết Facebook</span>
                </div>
                {onEdit && (
                  <button
                    type="button"
                    onClick={onEdit}
                    className="text-[11px] font-bold text-[#003B95] dark:text-blue-400 hover:underline"
                  >
                    + Thêm
                  </button>
                )}
              </div>
            )}

            {/* LinkedIn */}
            {profile.linkedinUrl && (
              <a
                href={profile.linkedinUrl.startsWith("http") ? profile.linkedinUrl : `https://${profile.linkedinUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-blue-400 dark:hover:border-blue-500 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-[#0A66C2] text-white grid place-items-center shadow-sm">
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-blue-600 transition-colors">
                      Hồ sơ LinkedIn
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px] block">
                      {profile.linkedinUrl.replace(/^https?:\/\/(www\.)?/, "")}
                    </span>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </a>
            )}

            {/* Website doanh nghiệp */}
            {profile.website && (
              <a
                href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-400 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#003B95] dark:text-blue-400 grid place-items-center">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-[#003B95] dark:group-hover:text-blue-400 transition-colors">
                      Website chính thức
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px] block">
                      {profile.website.replace(/^https?:\/\/(www\.)?/, "")}
                    </span>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400" />
              </a>
            )}

            {/* Địa chỉ trụ sở */}
            {profile.address && (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
                <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 grid place-items-center shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Khu vực / Trụ sở
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                    {profile.address}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
