// BC-Mobile — Một mục bình luận (hỗ trợ Cấp 1, Cấp 2, Cấp 3).
// Chuẩn UI Messenger/Facebook: Avatar + Tên + Bong bóng nội dung + Menu ... (Sao chép, Thu hồi) + Thả Emotion/Reactions + Phản hồi + Đường nối cây con.

import { useState, useRef, useEffect } from "react";
import { Copy, CornerUpLeft, Heart, MoreHorizontal, RotateCcw, Smile } from "lucide-react";
import { toast } from "sonner";
import { useFmt } from "@/lib/i18n";
import type { MomentComment } from "@/lib/business-connect/mobile/moment-comments.types";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";

const QUICK_REACTIONS = ["👍", "❤️", "😆", "😮", "😢", "🔥", "👏", "💡"] as const;

// Highlight @mentions in comment text
function renderCommentContent(
  text: string,
  mentions?: { userId: string; displayName: string }[],
) {
  if (!text) return null;

  // 1. If explicit mentions are passed, match those full displayNames directly
  const explicitNames = (mentions || [])
    .map((m) => m.displayName?.trim())
    .filter((n): n is string => Boolean(n));

  if (explicitNames.length > 0) {
    const escaped = explicitNames
      .sort((a, b) => b.length - a.length)
      .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex = new RegExp(`(@(?:${escaped.join("|")}))`, "g");
    const parts = text.split(regex);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return (
          <span
            key={i}
            className="font-semibold text-[#D8B282] bg-[#D8B282]/15 px-1 py-0.5 rounded cursor-pointer hover:underline"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  }

  // 2. Fallback regex for @mentions with any number of words (handles Vietnamese diacritics & letters)
  const parts = text.split(/(@[\p{L}\p{N}_]+(?:\s+[\p{L}\p{N}_]+)*)/gu);
  return parts.map((part, i) => {
    if (part.startsWith("@") && part.length > 1) {
      return (
        <span
          key={i}
          className="font-semibold text-[#D8B282] bg-[#D8B282]/15 px-1 py-0.5 rounded cursor-pointer hover:underline"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export type MomentCommentItemProps = {
  comment: MomentComment;
  level?: number; // 1, 2, 3
  onReply: (parentComment: MomentComment) => void;
  onToggleLike: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
};

export function MomentCommentItem({
  comment,
  level = 1,
  onReply,
  onToggleLike,
  onDelete,
}: MomentCommentItemProps) {
  const fmt = useFmt();
  const viewerUserId = useViewerUserId();
  const [likeBusy, setLikeBusy] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [userReactionEmoji, setUserReactionEmoji] = useState<string | null>(
    comment.userLiked ? "❤️" : null,
  );

  const menuRef = useRef<HTMLDivElement>(null);
  const reactionPickerRef = useRef<HTMLDivElement>(null);

  const isAuthor = comment.userId === viewerUserId;
  const author = comment.author;
  const replies = comment.replies || [];

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowActionMenu(false);
      }
      if (
        reactionPickerRef.current &&
        !reactionPickerRef.current.contains(event.target as Node)
      ) {
        setShowReactionPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLike = async (emoji?: string) => {
    if (likeBusy) return;
    setLikeBusy(true);
    setShowReactionPicker(false);
    try {
      if (emoji) {
        setUserReactionEmoji(emoji);
      } else {
        setUserReactionEmoji(comment.userLiked ? null : "❤️");
      }
      await onToggleLike(comment.id);
    } finally {
      setLikeBusy(false);
    }
  };

  const handleCopyText = () => {
    if (!comment.content) return;
    navigator.clipboard.writeText(comment.content);
    toast.success("Đã sao chép nội dung bình luận");
    setShowActionMenu(false);
  };

  const handleRecall = () => {
    if (!onDelete) return;
    setShowActionMenu(false);
    onDelete(comment.id);
    toast.success("Đã thu hồi bình luận");
  };

  return (
    <div className="flex flex-col gap-2 relative">
      {/* Khung bình luận hiện tại */}
      <div className="flex gap-2.5 items-start group">
        {/* Avatar */}
        {author.avatarUrl ? (
          <img
            src={author.avatarUrl}
            alt={author.displayName}
            className="w-8 h-8 shrink-0 rounded-full object-cover border border-[var(--bc-mobile-border)]"
            loading="lazy"
          />
        ) : (
          <div className="w-8 h-8 shrink-0 rounded-full bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] text-[var(--bc-mobile-text)] flex items-center justify-center font-bold text-[12px]">
            {author.initials || "HV"}
          </div>
        )}

        {/* Khối nội dung + Nút hành động */}
        <div className="flex-1 min-w-0">
          <div className="relative inline-flex items-center gap-1.5 max-w-full">
            <div className="bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] px-3.5 py-2 rounded-[16px] max-w-full text-left shadow-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-[13px] text-[var(--bc-mobile-text)] leading-tight">
                  {author.displayName}
                </span>
                {author.jobTitle && (
                  <span className="text-[11px] text-[var(--bc-mobile-muted)] font-normal">
                    · {author.jobTitle}
                  </span>
                )}
              </div>
              <div className="text-[13px] text-[var(--bc-mobile-text)] leading-snug mt-1 whitespace-pre-wrap break-words">
                {renderCommentContent(comment.content, comment.mentions)}
              </div>

              {/* Photo attached to comment */}
              {comment.photoUrl && (
                <div className="mt-2 rounded-xl overflow-hidden border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] max-w-[220px]">
                  <img
                    src={comment.photoUrl}
                    alt="Ảnh đính kèm"
                    loading="lazy"
                    onClick={() => window.open(comment.photoUrl || "", "_blank")}
                    className="w-full max-h-56 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                  />
                </div>
              )}
            </div>

            {/* Reaction badge floating on comment bubble if liked */}
            {comment.likesCount > 0 && (
              <span className="absolute -bottom-2 right-2 flex items-center gap-0.5 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-1.5 py-0.2 text-[10px] text-[var(--bc-mobile-accent)] shadow-sm">
                <span>{userReactionEmoji || "❤️"}</span>
                <span className="font-bold text-[10px] text-[var(--bc-mobile-text)]">{comment.likesCount}</span>
              </span>
            )}

            {/* Quick Action Button: ... (Three-dots menu) */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setShowActionMenu((prev) => !prev)}
                aria-label="Tuỳ chọn bình luận"
                className="grid h-6 w-6 place-items-center rounded-full text-[var(--bc-mobile-muted)] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--bc-mobile-surface-2)] hover:text-[var(--bc-mobile-text)] focus-visible:opacity-100 cursor-pointer"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>

              {/* Action Dropdown Menu */}
              {showActionMenu && (
                <div className="absolute left-0 top-7 z-40 min-w-[150px] rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] py-1 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-[var(--bc-mobile-text)] hover:bg-[var(--bc-mobile-surface-2)] hover:text-[var(--bc-mobile-accent)] cursor-pointer transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5 text-[var(--bc-mobile-muted)]" />
                    <span>Sao chép</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowActionMenu(false);
                      onReply(comment);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-[var(--bc-mobile-text)] hover:bg-[var(--bc-mobile-surface-2)] hover:text-[var(--bc-mobile-accent)] cursor-pointer transition-colors"
                  >
                    <CornerUpLeft className="h-3.5 w-3.5 text-[var(--bc-mobile-muted)]" />
                    <span>Phản hồi</span>
                  </button>

                  {/* Thu hồi bình luận — chỉ tác giả mới có */}
                  {isAuthor && onDelete && (
                    <button
                      type="button"
                      onClick={handleRecall}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-[#f87171] hover:bg-[#ef4444]/15 cursor-pointer transition-colors border-t border-[#2f3542]/50 mt-0.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Thu hồi bình luận</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Hàng hành động (Thích/Emotion, Phản hồi, Thời gian) */}
          <div className="flex items-center gap-3.5 mt-1.5 ml-1 text-[11px] font-semibold text-slate-500 dark:text-[#8a8d91]">
            {/* Reaction Bar & Nút Thích */}
            <div className="relative" ref={reactionPickerRef}>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleLike()}
                  className={`cursor-pointer transition-colors flex items-center gap-1 hover:text-slate-900 dark:hover:text-[#e4e6eb] ${
                    comment.userLiked ? "text-[#8C653B] dark:text-[#D8B282] font-bold" : ""
                  }`}
                >
                  <Heart
                    className={`h-3 w-3 ${comment.userLiked ? "fill-[#8C653B] text-[#8C653B] dark:fill-[#D8B282] dark:text-[#D8B282]" : ""}`}
                    strokeWidth={2}
                  />
                  <span>{comment.userLiked && userReactionEmoji ? `Thích ${userReactionEmoji}` : "Thích"}</span>
                </button>

                {/* Smile icon to open full emotion reactions picker */}
                <button
                  type="button"
                  onClick={() => setShowReactionPicker((prev) => !prev)}
                  title="Thả cảm xúc"
                  className="p-0.5 rounded text-slate-400 dark:text-[#6c7078] hover:text-[#8C653B] dark:hover:text-[#D8B282] transition-colors cursor-pointer"
                >
                  <Smile className="h-3 w-3" />
                </button>
              </div>

              {/* Floating Emotion Reactions Bar */}
              {showReactionPicker && (
                <div className="absolute bottom-6 left-0 z-40 flex items-center gap-1 rounded-full border border-slate-200 dark:border-[#D8B282]/30 bg-white/95 dark:bg-[#0f172a]/95 p-1 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                  {QUICK_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleLike(emoji)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[15px] hover:scale-130 transition-transform cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Nút Phản hồi */}
            <button
              type="button"
              onClick={() => onReply(comment)}
              className="cursor-pointer transition-colors hover:text-slate-900 dark:hover:text-[#e4e6eb] hover:underline"
            >
              Phản hồi
            </button>

            {/* Thời gian */}
            <span className="font-normal text-slate-400 dark:text-[#6c7078]">
              {fmt.rel(comment.createdAt)}
            </span>
          </div>

          {/* Cấp con (Cấp 2 hoặc Cấp 3): Đường nối cây .replies-container */}
          {replies.length > 0 && (
            <div className="ml-2 pl-3 border-l-2 border-slate-200 dark:border-[#2f3542] flex flex-col gap-3 mt-3">
              {replies.map((child) => (
                <MomentCommentItem
                  key={child.id}
                  comment={child}
                  level={Math.min(3, level + 1)}
                  onReply={onReply}
                  onToggleLike={onToggleLike}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
