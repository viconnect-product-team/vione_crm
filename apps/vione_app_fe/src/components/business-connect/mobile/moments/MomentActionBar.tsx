// BC-Mobile — Thanh tương tác Moment chuẩn mạng xã hội (Thích · Bình luận · Chia sẻ · Lưu).
// Thiết kế chuẩn dark luxury ViOne (#121824, #1c2333, #2f3542, #D8B282).

import { Bookmark, Heart, MessageCircle, Share2 } from "lucide-react";

export type MomentActionBarProps = {
  momentId: string;
  commentsCount: number;
  isCommentsOpen: boolean;
  onToggleComments: () => void;
  likesCount: number;
  userLiked: boolean;
  onToggleLike: () => void;
  isLikeBusy?: boolean;
  onShare?: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
};

export function MomentActionBar({
  commentsCount,
  isCommentsOpen,
  onToggleComments,
  likesCount,
  userLiked,
  onToggleLike,
  isLikeBusy = false,
  onShare,
  isBookmarked = false,
  onToggleBookmark,
}: MomentActionBarProps) {
  return (
    <div className="flex items-center justify-between border-t border-[var(--bc-mobile-border)] pt-2 mt-2.5">
      {/* Cụm tương tác chính bên trái: Thích & Bình luận */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Nút Thích */}
        <button
          type="button"
          onClick={onToggleLike}
          disabled={isLikeBusy}
          aria-label={userLiked ? "Bỏ thích" : "Thích"}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--bc-mobile-accent)] ${
            userLiked
              ? "bg-[#e0245e]/15 text-[#e0245e]"
              : "text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)] hover:bg-[var(--bc-mobile-surface-2)]"
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-transform active:scale-125 ${
              userLiked ? "fill-[#e0245e] text-[#e0245e]" : ""
            }`}
            strokeWidth={1.8}
          />
          <span>{userLiked ? "Đã thích" : "Thích"}</span>
          {likesCount > 0 && (
            <span className="font-semibold tabular-nums">({likesCount})</span>
          )}
        </button>

        {/* Nút Bình luận */}
        <button
          type="button"
          onClick={onToggleComments}
          aria-expanded={isCommentsOpen}
          aria-label="Mở bình luận"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--bc-mobile-accent)] ${
            isCommentsOpen
              ? "bg-[var(--bc-mobile-accent)]/15 text-[var(--bc-mobile-accent)]"
              : "text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)] hover:bg-[var(--bc-mobile-surface-2)]"
          }`}
        >
          <MessageCircle className="w-4 h-4" strokeWidth={1.8} />
          <span>Bình luận</span>
          {commentsCount > 0 && (
            <span className="font-semibold tabular-nums">({commentsCount})</span>
          )}
        </button>
      </div>

      {/* Cụm tương tác bên phải: Chia sẻ & Lưu (Bookmark) */}
      <div className="flex items-center gap-0.5">
        {onShare ? (
          <button
            type="button"
            onClick={onShare}
            aria-label="Chia sẻ khoảnh khắc"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)] hover:bg-[var(--bc-mobile-surface-2)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--bc-mobile-accent)]"
          >
            <Share2 className="w-4 h-4" strokeWidth={1.8} />
            <span className="hidden xs:inline">Chia sẻ</span>
          </button>
        ) : null}

        {onToggleBookmark ? (
          <button
            type="button"
            onClick={onToggleBookmark}
            aria-label={isBookmarked ? "Bỏ lưu khoảnh khắc" : "Lưu khoảnh khắc"}
            className={`p-1.5 rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--bc-mobile-accent)] ${
              isBookmarked
                ? "text-[var(--bc-mobile-accent)] bg-[var(--bc-mobile-accent)]/15"
                : "text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)] hover:bg-[var(--bc-mobile-surface-2)]"
            }`}
          >
            <Bookmark
              className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`}
              strokeWidth={1.8}
            />
          </button>
        ) : null}
      </div>
    </div>
  );
}

