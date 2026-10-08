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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";

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
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [coverLoadError, setCoverLoadError] = useState(false);

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
    <Drawer open={open} onOpenChange={(v) => !v && onClose()} shouldScaleBackground={false}>
      <DrawerContent className="bc-app mx-auto w-full max-w-[480px] rounded-t-[32px] border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-0 shadow-2xl text-slate-900 dark:text-slate-100 overflow-hidden">
        <DrawerTitle className="sr-only">Hồ sơ cá nhân — {profile.displayName}</DrawerTitle>
        <DrawerDescription className="sr-only">Chi tiết thông tin doanh nhân và liên hệ</DrawerDescription>

        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-4 right-4 z-40 grid h-8 w-8 place-items-center rounded-full bg-slate-900/60 dark:bg-black/50 text-white border border-white/20 shadow-sm backdrop-blur-md hover:bg-slate-900/80 dark:hover:bg-black/70 transition active:scale-95 cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <div
          className="max-h-[88dvh] overflow-y-auto px-0 pt-0"
          style={{ paddingBottom: "max(1.5rem, var(--bc-mobile-safe-bottom, 24px))" }}
        >
          {/* Ảnh bìa Cover */}
          <div className="relative h-32 sm:h-36 w-full overflow-hidden bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            {resolvedCover && !coverLoadError ? (
              <img
                src={resolvedCover}
                alt="Cover Photo"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                onError={() => setCoverLoadError(true)}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-slate-200 dark:to-slate-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Huy hiệu thành viên góc bìa */}
            <div className="absolute top-3 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-amber-400/40 text-amber-200 text-[10.5px] font-extrabold shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{profile.memberCode || "HỘI VIÊN CHÍNH THỨC"}</span>
            </div>
          </div>

          {/* Nội dung hồ sơ cá nhân */}
          <div className="px-5 pb-6 pt-0">
            {/* Avatar + Quick Action Row */}
            <div className="flex items-end justify-between -mt-12 mb-3">
              <div className="relative">
                {resolvedAvatar && !avatarLoadError ? (
                  <img
                    src={resolvedAvatar}
                    alt={profile.displayName}
                    className="h-24 w-24 rounded-2xl border-4 border-white dark:border-slate-950 object-cover shadow-xl bg-slate-100 dark:bg-slate-800"
                    onError={() => setAvatarLoadError(true)}
                  />
                ) : (
                  <div className="h-24 w-24 rounded-2xl border-4 border-white dark:border-slate-950 bg-slate-800 text-amber-300 font-black text-2xl grid place-items-center shadow-xl">
                    {initials}
                  </div>
                )}
                <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950" />
              </div>

              {/* Cụm nút hành động nhanh bên phải avatar */}
              <div className="flex items-center gap-2 mb-1">
                {onOpenQr && (
                  <button
                    type="button"
                    onClick={onOpenQr}
                    className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-800 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 shadow-sm cursor-pointer"
                    title="Mở mã QR danh thiếp"
                  >
                    <QrCode className="h-5 w-5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleShare}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 shadow-sm cursor-pointer"
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
                    className="grid h-10 w-10 place-items-center rounded-xl bg-[#DFB76C] hover:bg-[#d4a85a] text-slate-950 shadow-md hover:brightness-105 active:scale-95 transition cursor-pointer border border-[#f0d499]/80"
                  >
                    <Pencil className="h-4 w-4 stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>

            {/* Thông tin chính */}
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {profile.displayName}
                </h3>
                <BadgeCheck className="h-5 w-5 text-amber-500 dark:text-amber-400 shrink-0" />
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <Briefcase className="h-3.5 w-3.5 shrink-0" />
                <span>{profile.jobTitle || "Doanh nhân"}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{profile.companyName || "ViOne Ecosystem"}</span>
              </div>
            </div>

            {/* Bio giới thiệu ngắn */}
            {profile.bio && (
              <div className="mb-4 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                "{profile.bio}"
              </div>
            )}

            {/* Cụm nút liên hệ nhanh: Gọi điện, Nhắn tin, Zalo, Facebook */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {profile.phone ? (
                <a
                  href={`tel:${profile.phone}`}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-[#DFB76C] hover:bg-[#d4a85a] border border-[#f0d499]/80 text-slate-950 font-extrabold text-xs shadow-sm active:scale-95 transition cursor-pointer"
                >
                  <Phone className="h-4 w-4" />
                  <span>Gọi điện</span>
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs opacity-60 cursor-not-allowed"
                >
                  <Phone className="h-4 w-4" />
                  <span>Chưa có SĐT</span>
                </button>
              )}

              {zaloUrl ? (
                <a
                  href={zaloUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-sm active:scale-95 transition cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Chat Zalo</span>
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs opacity-60 cursor-not-allowed"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Chưa có Zalo</span>
                </button>
              )}
            </div>

            {/* Danh sách thông tin chi tiết */}
            <div className="space-y-2 text-xs">
              {/* Số điện thoại */}
              {profile.phone && (
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 grid place-items-center shrink-0 border border-amber-500/20">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Số điện thoại</span>
                      <span className="font-bold text-slate-900 dark:text-white">{profile.phone}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer"
                    title="Sao chép"
                  >
                    {copiedPhone ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              )}

              {/* Email */}
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 hover:border-amber-400 dark:hover:border-amber-400/40 transition group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400 grid place-items-center shrink-0 border border-blue-500/20">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Email làm việc</span>
                      <span className="font-bold text-slate-900 dark:text-white truncate block">{profile.email}</span>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0" />
                </a>
              )}

              {/* Facebook */}
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 hover:border-blue-500/40 transition group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-blue-600/10 text-blue-500 dark:text-blue-400 grid place-items-center shrink-0 border border-blue-600/20">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Facebook cá nhân / Doanh nghiệp</span>
                      <span className="font-bold text-slate-900 dark:text-white truncate block">
                        {profile.facebookUrl?.replace(/^https?:\/\/(www\.)?facebook\.com\/?/, "") || "Facebook"}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-blue-500 shrink-0" />
                </a>
              )}

              {/* Website */}
              {profile.website && (
                <a
                  href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 hover:border-emerald-500/40 transition group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 grid place-items-center shrink-0 border border-emerald-500/20">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Website chính thức</span>
                      <span className="font-bold text-slate-900 dark:text-white truncate block">
                        {profile.website.replace(/^https?:\/\/(www\.)?/, "")}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-emerald-500 shrink-0" />
                </a>
              )}

              {/* Địa chỉ trụ sở */}
              {profile.address && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60">
                  <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 grid place-items-center shrink-0 border border-slate-200 dark:border-slate-700">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Khu vực / Trụ sở</span>
                    <span className="font-bold text-slate-900 dark:text-white block truncate">{profile.address}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
