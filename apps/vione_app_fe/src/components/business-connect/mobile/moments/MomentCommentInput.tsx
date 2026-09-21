// BC-Mobile — Khung nhập bình luận kèm gợi ý Tag tên (@mention), gửi kèm ảnh và chế độ Phản hồi.

import { useEffect, useRef, useState } from "react";
import { Send, X, AtSign, Loader2, Image as ImageIcon } from "lucide-react";
import type { MentionableUser, MomentComment } from "@/lib/business-connect/mobile/moment-comments.types";
import { searchMentionableUsers } from "@/lib/business-connect/mobile/moment-comments.functions";
import { uploadFileToNest } from "@/lib/api-client";
import { toast } from "sonner";

export type MomentCommentInputProps = {
  replyingTo?: MomentComment | null;
  replyTo?: MomentComment | null;
  onCancelReply: () => void;
  onSubmit: (data: {
    content: string;
    parentId?: string | null;
    photoUrl?: string | null;
    mentions?: any[];
  }) => Promise<void>;
  disabled?: boolean;
  isSubmitting?: boolean;
  momentId?: string;
};

export function MomentCommentInput({
  replyingTo,
  replyTo,
  onCancelReply,
  onSubmit,
  disabled,
  isSubmitting,
}: MomentCommentInputProps) {
  const activeReply = replyingTo ?? replyTo ?? null;
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionableUser[]>([]);
  const [chosenMentions, setChosenMentions] = useState<{ userId: string; displayName: string }[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [attachedPhoto, setAttachedPhoto] = useState<{ file: File; previewUrl: string } | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up preview object url on unmount or replace
  useEffect(() => {
    return () => {
      if (attachedPhoto?.previewUrl) {
        URL.revokeObjectURL(attachedPhoto.previewUrl);
      }
    };
  }, [attachedPhoto]);

  // When activeReply changes, auto-fill @Name into input and focus
  useEffect(() => {
    if (activeReply) {
      const mentionText = `@${activeReply.author.displayName} `;
      setText(mentionText);
      setChosenMentions((prev) => [
        ...prev.filter((m) => m.userId !== activeReply.userId),
        { userId: activeReply.userId, displayName: activeReply.author.displayName },
      ]);
      inputRef.current?.focus();
    }
  }, [activeReply]);

  // Handle @ detection
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);

    const cursorPos = e.target.selectionStart || val.length;
    const textBeforeCursor = val.slice(0, cursorPos);

    // Only trigger mention search when currently typing directly after @ (without trailing spaces)
    const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]*)$/);

    if (match) {
      const query = match[1] || "";
      if (query.length <= 25) {
        setMentionQuery(query);
        return;
      }
    }
    setMentionQuery(null);
  };

  // Fetch mention suggestions
  useEffect(() => {
    if (mentionQuery === null) {
      setMentionSuggestions([]);
      return;
    }

    let active = true;
    setLoadingSuggestions(true);
    searchMentionableUsers(mentionQuery).then((res) => {
      if (active) {
        setMentionSuggestions(res);
        setLoadingSuggestions(false);
      }
    });

    return () => {
      active = false;
    };
  }, [mentionQuery]);

  const selectMention = (user: MentionableUser) => {
    if (!inputRef.current) return;
    const cursorPos = inputRef.current.selectionStart || text.length;
    const textBeforeCursor = text.slice(0, cursorPos);
    const textAfterCursor = text.slice(cursorPos);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");

    const newBefore = textBeforeCursor.slice(0, lastAtIdx) + `@${user.displayName} `;
    setText(newBefore + textAfterCursor);
    setMentionQuery(null);
    setChosenMentions((prev) => [
      ...prev.filter((m) => m.userId !== user.userId),
      { userId: user.userId, displayName: user.displayName },
    ]);
    inputRef.current.focus();
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh hợp lệ");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ảnh quá lớn (tối đa 10MB)");
      return;
    }

    if (attachedPhoto?.previewUrl) {
      URL.revokeObjectURL(attachedPhoto.previewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setAttachedPhoto({ file, previewUrl });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemovePhoto = () => {
    if (attachedPhoto?.previewUrl) {
      URL.revokeObjectURL(attachedPhoto.previewUrl);
    }
    setAttachedPhoto(null);
  };

  const handleSend = async () => {
    const clean = text.trim();
    if ((!clean && !attachedPhoto) || submitting || uploadingPhoto) return;

    setSubmitting(true);
    let photoUrl: string | null = null;

    try {
      if (attachedPhoto) {
        setUploadingPhoto(true);
        try {
          const uploadedUrl = await uploadFileToNest(attachedPhoto.file, "relationship-moments");
          photoUrl = uploadedUrl || null;
        } catch {
          // Fallback to base64 if direct upload endpoint fails
          const reader = new FileReader();
          photoUrl = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(attachedPhoto.file);
          });
        }
      }

      await onSubmit({
        content: clean || "(Hình ảnh)",
        parentId: activeReply?.id || null,
        photoUrl,
        mentions: chosenMentions,
      });

      setText("");
      setChosenMentions([]);
      setMentionQuery(null);
      handleRemovePhoto();
      onCancelReply();
    } catch (err) {
      toast.error("Không thể gửi bình luận. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
      setUploadingPhoto(false);
    }
  };

  // Close mention suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mentionQuery !== null) {
        const popover = document.getElementById("mention-popover");
        if (popover && !popover.contains(e.target as Node) && !inputRef.current?.contains(e.target as Node)) {
          setMentionQuery(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mentionQuery]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" && mentionQuery !== null) {
      e.preventDefault();
      setMentionQuery(null);
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      if (mentionQuery !== null && mentionSuggestions.length > 0) {
        e.preventDefault();
        selectMention(mentionSuggestions[0]);
        return;
      }
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="relative border-t border-[var(--bc-mobile-border)] pt-3 mt-3">
      {/* Banner đang phản hồi */}
      {activeReply && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] px-3 py-1.5 text-xs text-[var(--bc-mobile-accent)]">
          <span className="truncate">
            Đang phản hồi <strong>@{activeReply.author.displayName}</strong>
          </span>
          <button
            type="button"
            onClick={onCancelReply}
            className="text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)] transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Ảnh đính kèm xem trước */}
      {attachedPhoto && (
        <div className="mb-2.5 relative inline-block">
          <div className="relative rounded-xl overflow-hidden border border-[var(--bc-mobile-border-gold,#D8B282)]/60 max-w-[140px] max-h-[140px] bg-[var(--bc-mobile-surface-2)] shadow-md">
            <img
              src={attachedPhoto.previewUrl}
              alt="Ảnh đính kèm"
              className="w-full h-full object-cover max-h-[140px]"
            />
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="absolute top-1 right-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white hover:bg-black transition-colors"
              title="Gỡ ảnh"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          {uploadingPhoto && (
            <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center text-white text-[11px] font-medium gap-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Đang tải ảnh...
            </div>
          )}
        </div>
      )}

      {/* Mention suggestion popover */}
      {mentionQuery !== null && (
        <div
          id="mention-popover"
          className="absolute bottom-full left-0 right-0 mb-2 max-h-48 overflow-y-auto rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] shadow-2xl p-1 z-30"
        >
          <div className="px-2 py-1 text-[11px] font-semibold text-[var(--bc-mobile-muted)] uppercase tracking-wider">
            Nhắc đến hội viên
          </div>
          {loadingSuggestions ? (
            <div className="flex items-center justify-center p-3 text-xs text-[var(--bc-mobile-muted)]">
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              Đang tìm kiếm…
            </div>
          ) : mentionSuggestions.length === 0 ? (
            <div className="p-3 text-center text-xs text-[var(--bc-mobile-muted)]">
              Không tìm thấy người phù hợp
            </div>
          ) : (
            mentionSuggestions.map((u) => (
              <button
                key={u.userId}
                type="button"
                onClick={() => selectMention(u)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[var(--bc-mobile-surface-2)] transition-colors text-left cursor-pointer"
              >
                {u.avatarUrl ? (
                  <img
                    src={u.avatarUrl}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover border border-[var(--bc-mobile-border)]"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[var(--bc-mobile-surface-2)] text-[10px] font-bold text-[var(--bc-mobile-accent)] grid place-items-center">
                    {u.initials || "HV"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-[var(--bc-mobile-text)] truncate">
                    {u.displayName}
                  </div>
                  {u.jobTitle && (
                    <div className="text-[11px] text-[var(--bc-mobile-muted)] truncate">
                      {u.jobTitle} {u.companyName ? `· ${u.companyName}` : ""}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Hidden image input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoSelect}
      />

      {/* Ô nhập bình luận */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] text-[var(--bc-mobile-accent)] font-bold text-xs flex items-center justify-center shrink-0">
          HV
        </div>

        <div className="relative flex-1 flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || submitting || isSubmitting || uploadingPhoto}
            placeholder={activeReply ? `Phản hồi @${activeReply.author.displayName}…` : "Viết bình luận… (gõ @ hoặc đính kèm ảnh)"}
            className="w-full bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] rounded-full px-4 py-2 pr-16 text-[13px] text-[var(--bc-mobile-text)] placeholder:text-[var(--bc-mobile-muted)] outline-none transition-colors focus:border-[var(--bc-mobile-accent)]"
          />

          <div className="absolute right-2 flex items-center gap-1.5 text-[var(--bc-mobile-muted)]">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1 hover:text-[var(--bc-mobile-accent)] transition-colors cursor-pointer"
              title="Đính kèm ảnh"
            >
              <ImageIcon className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setText((prev) => `${prev}@`);
                setMentionQuery("");
                inputRef.current?.focus();
              }}
              className="p-1 hover:text-[var(--bc-mobile-accent)] transition-colors cursor-pointer"
              title="Gắn thẻ người dùng"
            >
              <AtSign className="h-4 w-4" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={(!text.trim() && !attachedPhoto) || submitting || disabled || uploadingPhoto}
          className="h-9 w-9 shrink-0 grid place-items-center rounded-full bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-slate-950 font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          aria-label="Gửi bình luận"
        >
          {submitting || uploadingPhoto ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
