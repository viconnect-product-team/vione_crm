// BC-Mobile-7E — One Network feed card (Executive Minimal Luxury, ViOne).
//
// Presentation only over the canonical Moment domain: avatar ảnh, huy hiệu V,
// "chức danh · công ty", "ngày · địa điểm", ảnh lớn / lưới ảnh kèm "+N", và
// câu mô tả cuộc gặp. Thân thẻ điều hướng tới Person Detail; hàng hành động
// (Ghi nhớ · Bình luận · Thích · Kết nối · "…") nằm ngoài liên kết để giữ ngữ nghĩa đúng.

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  Globe,
  Loader2,
  Lock,
  MapPin,
  MoreHorizontal,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFmt, useT, type TKey } from "@/lib/i18n";
import { fetchNestApi } from "@/lib/api-client";
import { useNetworkRowConnect } from "@/hooks/use-network-row-connect";
import { ConnectConfirmDialog } from "./ConnectConfirmDialog";
import { networkFeedKeys } from "@/hooks/use-network-feed";
import { MomentManageSheet } from "./MomentManageSheet";
import { MomentActionBar } from "./moments/MomentActionBar";
import { MomentCommentSheet } from "./moments/MomentCommentSheet";
import { MomentImageViewer } from "./moments/MomentImageViewer";
import { useMomentComments } from "@/hooks/use-moment-comments";
import type { BcNetworkFeedItem } from "@/lib/business-connect/mobile/network-feed.types";
import type { BcMobileNetworkPerson } from "@/hooks/use-business-connect-network";

import { useViewerUserId } from "@/hooks/use-viewer-user-id";
import { deleteMomentDirect } from "@/lib/business-connect/mobile/moment.functions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function initialsOf(name: string | null): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "•";
  const first = words[0]?.[0] ?? "";
  const last = words[1]?.[0] ?? "";
  return (first + last).toUpperCase();
}

function PhotoGrid({
  urls,
  alt,
  onImageClick,
}: {
  urls: string[];
  alt: string;
  onImageClick?: (index: number) => void;
}) {
  if (urls.length === 0) return null;

  if (urls.length === 1) {
    return (
      <button
        type="button"
        onClick={() => onImageClick?.(0)}
        className="mt-3 block w-full text-left cursor-pointer overflow-hidden rounded-xl group focus:outline-none"
      >
        <img
          src={urls[0]}
          alt={alt}
          loading="lazy"
          className="aspect-[16/10] w-full rounded-xl object-cover ring-1 ring-[var(--bc-mobile-border)] transition-transform duration-200 group-hover:scale-[1.01] active:scale-[0.99]"
        />
      </button>
    );
  }

  const shown = urls.slice(0, 3);
  const extra = urls.length - shown.length;
  return (
    <div className="mt-3 grid grid-cols-3 gap-1.5">
      {shown.map((url, i) => (
        <button
          key={url}
          type="button"
          onClick={() => onImageClick?.(i)}
          className="relative block w-full text-left cursor-pointer overflow-hidden rounded-lg group focus:outline-none"
        >
          <img
            src={url}
            alt={alt}
            loading="lazy"
            className="aspect-square w-full rounded-lg object-cover ring-1 ring-[var(--bc-mobile-border)] transition-transform duration-200 group-hover:scale-[1.02] active:scale-[0.98]"
          />
          {i === shown.length - 1 && extra > 0 ? (
            <span
              aria-hidden="true"
              className="absolute inset-0 grid place-items-center rounded-lg bg-[#04111F]/70 text-[18px] font-bold text-white backdrop-blur-[1px]"
            >
              +{extra}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function NetworkFeedCard({
  item,
  person,
}: {
  item: BcNetworkFeedItem;
  person: BcMobileNetworkPerson | null;
}) {
  const t = useT();
  const fmt = useFmt();
  const viewerUserId = useViewerUserId();

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  // Author details (người đăng)
  const authorName = item.owner?.displayName || person?.displayName || t("bc.mobile.network.unknownPerson");
  const authorAvatar = item.owner?.avatarUrl || person?.avatarUrl || null;
  const authorHeadline = item.owner?.headline || person?.headline || null;
  const authorCompany = item.owner?.companyName || person?.companyName || null;
  const authorRoleLine = [authorHeadline, authorCompany].filter(Boolean).join(" • ");
  const authorUserId = item.owner?.userId || item.ownerUserId;

  // Tagged / Counterpart details (người được tag / cùng tham gia)
  const targetName = item.target?.displayName || (item.owner?.userId && item.owner.userId !== (person?.personId || (person as any)?.id) ? person?.displayName : null);
  const targetPersonId = item.target?.personId || item.personId;

  const place = item.placeLabel ?? item.eventName;
  const timeDisplay = item.createdAt ? fmt.rel(item.createdAt) : fmt.rel(item.occurredAt);

  const handleImageClick = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  return (
    <li className="rounded-2xl bc-translucent-card p-3.5 transition-colors duration-150 ease-out hover:border-[#D8B282]/40 motion-reduce:transition-none">
      {/* Hàng nhận diện: ảnh đại diện tác giả · tên tác giả [cùng với người được tag] · chức danh • công ty */}
      <div className="flex items-start gap-3">
        <Link
          to="/connect-app/network/$personId"
          params={{ personId: authorUserId ? `u:${authorUserId}` : item.personId }}
          aria-label={authorName}
          className="shrink-0 transition-transform active:scale-95"
        >
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt=""
              loading="lazy"
              className="h-10 w-10 shrink-0 rounded-full object-cover border border-solid border-[var(--bc-mobile-border)]"
            />
          ) : (
            <span
              aria-hidden="true"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-sm font-semibold text-[var(--bc-mobile-text,#0F172A)] border border-solid border-[var(--bc-mobile-border)]"
            >
              {initialsOf(authorName)}
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center flex-wrap gap-1 text-sm font-semibold text-[var(--bc-mobile-text,#0F172A)]">
            <Link
              to="/connect-app/network/$personId"
              params={{ personId: authorUserId ? `u:${authorUserId}` : item.personId }}
              className="hover:text-[var(--bc-mobile-accent)] transition-colors"
            >
              {authorName}
            </Link>

            {targetName && targetName !== authorName ? (
              <span className="inline-flex items-center gap-1 text-[13px] font-normal text-[var(--bc-mobile-muted,#64748B)]">
                <span>cùng với</span>
                <Link
                  to="/connect-app/network/$personId"
                  params={{ personId: targetPersonId }}
                  className="font-medium text-[var(--bc-mobile-accent)] hover:underline"
                >
                  @{targetName}
                </Link>
              </span>
            ) : null}

            {person?.relationshipKind === "connection" ? (
              <span
                title={t("bc.mobile.network.feed.verified")}
                aria-label={t("bc.mobile.network.feed.verified")}
                className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border border-solid border-[var(--bc-mobile-accent)] text-[10px] font-bold leading-none bg-clip-text text-transparent bg-[linear-gradient(135deg,#DFB876_0%,#B8860B_45%,#966A06_70%,#6E4D00_100%)] dark:bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)]"
              >
                V
              </span>
            ) : null}
          </div>

          {authorRoleLine ? (
            <p className="mt-0.5 truncate text-[10px] font-normal text-[var(--bc-mobile-muted,#64748B)] leading-[15px]">
              {authorRoleLine}
            </p>
          ) : null}

          <p className="mt-1 flex items-center gap-1.5 text-[10px] font-normal text-[var(--bc-mobile-muted,#64748B)] leading-[15px]">
            <CalendarDays aria-hidden="true" className="h-3.5 w-3.5 text-[var(--bc-mobile-muted)]" strokeWidth={1.7} />
            <span className="truncate">{timeDisplay}</span>
            <span aria-hidden="true">·</span>
            {item.visibility === "public" ? (
              <span className="inline-flex items-center gap-0.5 text-[9.5px] text-[var(--bc-mobile-muted)]" title="Công khai">
                <Globe className="h-3 w-3" /> Công khai
              </span>
            ) : item.visibility === "private" ? (
              <span className="inline-flex items-center gap-0.5 text-[9.5px] text-[var(--bc-mobile-muted)]" title="Chỉ mình tôi">
                <Lock className="h-3 w-3" /> Riêng tư
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[9.5px] text-[var(--bc-mobile-muted)]" title="Bạn bè">
                <Users className="h-3 w-3" /> Bạn bè
              </span>
            )}
            {place ? (
              <>
                <span aria-hidden="true">·</span>
                <MapPin aria-hidden="true" className="h-3.5 w-3.5 text-[var(--bc-mobile-muted)]" strokeWidth={1.7} />
                <span className="truncate">{place}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      {/* Ảnh lớn hoặc lưới ảnh kèm "+N" (Click để xem toàn màn hình) */}
      <PhotoGrid
        urls={item.photoUrls}
        alt={t("bc.mobile.network.feed.photoAlt")}
        onImageClick={handleImageClick}
      />

      {/* Trình xem ảnh toàn màn hình Facebook-style */}
      <MomentImageViewer
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        images={item.photoUrls}
        initialIndex={viewerIndex}
        authorName={authorName}
        authorAvatar={authorAvatar}
        caption={item.note || item.eventName}
        timeDisplay={timeDisplay}
      />

      {/* Câu mô tả cuộc gặp */}
      {item.note ? (
        <p className="mt-3 line-clamp-3 text-xs font-normal leading-relaxed text-[var(--bc-mobile-text,#334155)]">
          {item.note}
        </p>
      ) : null}

      <FeedActionRow item={item} person={person} />
    </li>
  );
}

/**
 * Hàng hành động của thẻ feed: "Ghi nhớ" (sửa ghi chú cuộc gặp),
 * "Bình luận" (mở/đóng cây bình luận 3 tầng), "Thích" (thả tim real-time),
 * và "Kết nối" (khi có thể kết nối).
 */
function FeedActionRow({
  item,
  person,
}: {
  item: BcNetworkFeedItem;
  person: BcMobileNetworkPerson | null;
}) {
  const t = useT();
  const fmt = useFmt();
  const queryClient = useQueryClient();
  const viewerUserId = useViewerUserId();
  const [manageOpen, setManageOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Author & Target IDs & Details
  const authorUserId = item.owner?.userId || item.ownerUserId;
  const authorName = item.owner?.displayName || person?.displayName || t("bc.mobile.network.unknownPerson");
  const authorAvatar = item.owner?.avatarUrl || person?.avatarUrl || null;
  const authorHeadline = item.owner?.headline || person?.headline || null;
  const authorCompany = item.owner?.companyName || person?.companyName || null;
  const authorRoleLine = [authorHeadline, authorCompany].filter(Boolean).join(" • ");
  const targetName = item.target?.displayName || (item.owner?.userId && item.owner.userId !== (person?.personId || (person as any)?.id) ? person?.displayName : null);
  const targetPersonId = item.target?.personId || item.personId;
  const place = item.placeLabel ?? item.eventName;
  const timeDisplay = item.createdAt ? fmt.rel(item.createdAt) : fmt.rel(item.occurredAt);

  // Phân quyền: Chỉ tác giả/người đăng mới có quyền chỉnh sửa / xoá khoảnh khắc
  const isOwner = Boolean(
    viewerUserId &&
      (authorUserId === viewerUserId ||
       item.ownerUserId === viewerUserId ||
       item.owner?.userId === viewerUserId)
  );

  const {
    totalComments,
    likesCount,
    userLiked,
    toggleMomentLike,
    isLikingMoment,
  } = useMomentComments(item.momentId);

  const eligible = Boolean(person && person.relationshipKind !== "connection" && person.cardSlug);
  const { state, connect, accept, decline, cancel, busy } = useNetworkRowConnect(
    person?.cardSlug ?? null,
    eligible,
  );

  const run = (mutation: { mutateAsync: () => Promise<unknown> }, successKey: TKey) => {
    void mutation
      .mutateAsync()
      .then(() => toast.success(t(successKey)))
      .catch(() => toast.error(t("bc.mobile.connection.error")));
  };

  const handleDeleteMoment = async () => {
    setDeleting(true);
    try {
      await deleteMomentDirect(item.momentId);
      toast.success("Đã xoá khoảnh khắc thành công");
      setDeleteConfirmOpen(false);
      void queryClient.invalidateQueries({ queryKey: networkFeedKeys.root });
    } catch (err: any) {
      toast.error(err?.message || "Không thể xoá khoảnh khắc. Vui lòng thử lại sau.");
    } finally {
      setDeleting(false);
    }
  };

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    fetchNestApi<{ ok: boolean; isMuted: boolean }>(`/connect-app/moments/${item.momentId}/mute-status`)
      .then((res) => {
        if (res?.ok) setIsMuted(res.isMuted);
      })
      .catch(() => {});
  }, [item.momentId]);

  const handleToggleMute = async () => {
    try {
      const res = await fetchNestApi<{ ok: boolean; isMuted: boolean }>(`/connect-app/moments/${item.momentId}/mute`, {
        method: "POST",
      });
      if (res?.ok) {
        setIsMuted(res.isMuted);
        toast.success(res.isMuted ? "Đã tắt thông báo về khoảnh khắc này" : "Đã bật thông báo về khoảnh khắc này");
      }
    } catch {
      toast.error("Không thể thay đổi cài đặt thông báo");
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/connect-app/network#moment-${item.momentId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.eventName || "Khoảnh khắc Business Connect",
          text: item.note || "Khoảnh khắc giao thương trên ViOne",
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Đã sao chép liên kết khoảnh khắc");
    } catch {
      toast.error("Không thể sao chép liên kết");
    }
  };

  const handleToggleBookmark = () => {
    setIsBookmarked((prev) => {
      const next = !prev;
      if (next) {
        toast.success("Đã lưu khoảnh khắc vào mục Đã lưu");
      } else {
        toast.info("Đã bỏ lưu khoảnh khắc");
      }
      return next;
    });
  };

  const pill =
    "inline-flex min-h-[32px] items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] disabled:opacity-60 motion-reduce:transition-none";
  const quiet = `${pill} bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-text)] active:bg-[var(--bc-mobile-border)]`;
  const gold = `${pill} bc-cta-gold`;
  const spinner = busy ? <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" /> : null;

  return (
    <>
      {/* Khối Kết nối (nếu có lời mời hoặc chưa kết nối) */}
      {eligible && (state === "none" || state === "saved" || state === "pending_sent" || state === "pending_received") && (
        <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-[#1c2333]/50 border border-[#2f3542]/40 px-3 py-2">
          <span className="text-xs text-[#d8c3b1] truncate">
            {state === "pending_received"
              ? "Đã nhận lời mời kết nối"
              : state === "pending_sent"
              ? "Đã gửi lời mời kết nối"
              : "Chưa kết nối với hội viên"}
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            {state === "none" || state === "saved" ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmOpen(true)}
                  className={gold}
                >
                  {spinner ?? <UserPlus aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />}
                  {t("bc.mobile.connection.connect")}
                </button>
                <ConnectConfirmDialog
                  open={confirmOpen}
                  onOpenChange={setConfirmOpen}
                  personLabel={person?.displayName ?? null}
                  busy={busy}
                  onConfirm={() => {
                    run(connect, "bc.mobile.connection.toast.sent");
                    setConfirmOpen(false);
                  }}
                />
              </>
            ) : null}

            {state === "pending_sent" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => run(cancel, "bc.mobile.connection.toast.withdrawn")}
                className={quiet}
              >
                {spinner ?? <X aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />}
                {t("bc.mobile.connection.withdraw")}
              </button>
            ) : null}

            {state === "pending_received" ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(accept, "bc.mobile.connection.toast.accepted")}
                  className={gold}
                >
                  {spinner ?? <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />}
                  {t("bc.mobile.connection.accept")}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(decline, "bc.mobile.connection.toast.declined")}
                  className={quiet}
                >
                  {t("bc.mobile.connection.decline")}
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Thanh tương tác Thích - Bình luận - Chia sẻ - Lưu */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <MomentActionBar
            momentId={item.momentId}
            commentsCount={totalComments}
            isCommentsOpen={commentsOpen}
            onToggleComments={() => setCommentsOpen((prev) => !prev)}
            likesCount={likesCount}
            userLiked={userLiked}
            onToggleLike={() => toggleMomentLike()}
            isLikeBusy={isLikingMoment}
            onShare={handleShare}
            isBookmarked={isBookmarked}
            onToggleBookmark={handleToggleBookmark}
          />
        </div>

        {/* Menu mở rộng (Xem hồ sơ, Sao chép link, Chỉnh sửa / Xoá khoảnh khắc) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={t("bc.mobile.network.feed.more")}
              className="mt-2 ml-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[var(--bc-mobile-muted)] transition-colors duration-150 active:bg-[var(--bc-mobile-surface-2)] hover:text-[#e4e6eb] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D8B282] cursor-pointer"
            >
              <MoreHorizontal aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[190px]">
            <DropdownMenuItem asChild>
              <Link to="/connect-app/network/$personId" params={{ personId: authorUserId ? `u:${authorUserId}` : item.personId }}>
                Xem hồ sơ {authorName.split(" ").pop()}
              </Link>
            </DropdownMenuItem>

            {targetName && targetName !== authorName ? (
              <DropdownMenuItem asChild>
                <Link to="/connect-app/network/$personId" params={{ personId: targetPersonId }}>
                  Xem hồ sơ {targetName.split(" ").pop()}
                </Link>
              </DropdownMenuItem>
            ) : null}

            <DropdownMenuItem onSelect={handleShare}>
              Sao chép liên kết
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={handleToggleBookmark}>
              {isBookmarked ? "Bỏ lưu khoảnh khắc" : "Lưu khoảnh khắc"}
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={handleToggleMute} className="cursor-pointer">
              {isMuted ? "Bật thông báo khoảnh khắc" : "Tắt thông báo khoảnh khắc"}
            </DropdownMenuItem>

            {/* Chỉ hiện tuỳ chọn Sửa & Xoá cho chính chủ sở hữu bài đăng */}
            {isOwner ? (
              <>
                <DropdownMenuItem
                  onSelect={() => setManageOpen(true)}
                  className="text-[var(--bc-mobile-accent)] focus:text-[var(--bc-mobile-accent)] cursor-pointer"
                >
                  {t("bc.mobile.network.feed.editMoment")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setDeleteConfirmOpen(true)}
                  className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                >
                  Xoá khoảnh khắc
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Facebook-style Bottom Sheet Bình luận */}
      <MomentCommentSheet
        momentId={item.momentId}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        authorName={authorName}
        postPreview={{
          authorName,
          authorAvatar,
          authorRoleLine,
          timeDisplay,
          place,
          content: item.note || item.eventName,
          photos: item.photoUrls || [],
          likeCount: likesCount,
          isLiked: userLiked,
          onToggleLike: () => toggleMomentLike(),
        }}
      />

      {/* Sheet quản lý / sửa ghi chú khoảnh khắc */}
      <MomentManageSheet
        open={manageOpen}
        onOpenChange={setManageOpen}
        momentId={item.momentId}
        occurredAt={item.occurredAt}
        title={item.eventName}
        placeLabel={item.placeLabel}
        note={item.note}
        photoUrls={item.photoUrls}
        visibility={item.visibility}
        targetPersonId={item.personId}
        targetPersonName={item.target?.displayName}
        onChanged={() => {
          void queryClient.invalidateQueries({ queryKey: networkFeedKeys.root });
        }}
      />

      {/* Dialog xác nhận xoá khoảnh khắc */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="border border-[#2a364a] bg-[#0c131f]/95 backdrop-blur-xl text-[#f1f5f9]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#f87171]">Xác nhận xoá khoảnh khắc</AlertDialogTitle>
            <AlertDialogDescription className="text-[#94a3b8]">
              Bạn có chắc chắn muốn xoá khoảnh khắc này? Hành động này sẽ xoá vĩnh viễn hình ảnh, bình luận và lượt thích đi kèm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              className="border-[#334155] bg-[#1e293b] text-[#cbd5e1] hover:bg-[#334155]"
            >
              Huỷ
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteMoment();
              }}
              className="bg-[#ef4444] text-white hover:bg-[#dc2626]"
            >
              {deleting ? "Đang xoá..." : "Xoá vĩnh viễn"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

