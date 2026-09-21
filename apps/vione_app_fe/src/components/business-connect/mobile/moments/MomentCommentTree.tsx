// BC-Mobile — Khung danh sách bình luận phân cấp 3 tầng (MomentCommentTree).
// Tích hợp Real-time WebSocket + Gợi ý @mention + Trả lời cấp 1/2/3.

import { useState } from "react";
import { Loader2, MessageSquareOff } from "lucide-react";
import { useMomentComments } from "@/hooks/use-moment-comments";
import { MomentCommentItem } from "./MomentCommentItem";
import { MomentCommentInput } from "./MomentCommentInput";
import type { MomentComment } from "@/lib/business-connect/mobile/moment-comments.types";

export type MomentCommentTreeProps = {
  momentId: string;
  isOpen: boolean;
};

export function MomentCommentTree({ momentId, isOpen }: MomentCommentTreeProps) {
  const {
    comments,
    isLoadingComments,
    addComment,
    deleteComment,
    toggleCommentLike,
    isAddingComment,
  } = useMomentComments(momentId);

  const [replyTarget, setReplyTarget] = useState<MomentComment | null>(null);

  if (!isOpen) return null;

  const handleReply = (comment: MomentComment) => {
    setReplyTarget(comment);
  };

  const handleCancelReply = () => {
    setReplyTarget(null);
  };

  const handleSubmit = async (data: {
    content: string;
    parentId?: string | null;
    mentions?: { userId: string; displayName: string }[];
  }) => {
    await addComment(data);
    setReplyTarget(null);
  };

  return (
    <div className="mt-3 pt-3 border-t border-[#2f3542]/50 flex flex-col gap-3 animate-in fade-in duration-200">
      {/* Danh sách bình luận */}
      {isLoadingComments ? (
        <div className="flex items-center justify-center py-6 text-[#8a8d91]">
          <Loader2 className="w-5 h-5 animate-spin text-[#D8B282]" />
          <span className="ml-2 text-xs">Đang tải bình luận...</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-5 text-center text-[#8a8d91]">
          <MessageSquareOff className="w-7 h-7 text-[#8a8d91]/50 mb-1.5" strokeWidth={1.5} />
          <p className="text-xs">Chưa có bình luận nào.</p>
          <p className="text-[11px] text-[#8a8d91]/70 mt-0.5">Hãy là người đầu tiên chia sẻ cảm nghĩ!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {comments.map((comment) => (
            <MomentCommentItem
              key={comment.id}
              comment={comment}
              level={1}
              onReply={handleReply}
              onToggleLike={toggleCommentLike}
              onDelete={deleteComment}
            />
          ))}
        </div>
      )}

      {/* Khung soạn thảo bình luận cố định ở chân */}
      <div className="pt-2">
        <MomentCommentInput
          momentId={momentId}
          replyTo={replyTarget}
          onCancelReply={handleCancelReply}
          onSubmit={handleSubmit}
          isSubmitting={isAddingComment}
        />
      </div>
    </div>
  );
}
