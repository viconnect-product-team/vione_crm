import React, { useState } from "react";
import { X, Sparkles, Newspaper, Image, FileText, AlignLeft, Tag, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createCommunityNewsFn } from "@/lib/business-connect/mobile/community.functions";

interface CreateNewsModalProps {
  communityId: string;
  communityName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const NEWS_CATEGORIES = [
  { id: "ANNOUNCEMENT", label: "Thông báo Ban Chấp Hành" },
  { id: "BUSINESS_DEAL", label: "Tin tức Giao thương & Hợp tác" },
  { id: "MEMBER_SPOTLIGHT", label: "Gương mặt & Doanh nghiệp Hội viên" },
  { id: "CLUB_ACTIVITY", label: "Hoạt động & Sự kiện CLB" },
  { id: "MARKET_INSIGHT", label: "Bản tin Thị trường & Chính sách" },
];

export function CreateNewsModal({
  communityId,
  communityName,
  isOpen,
  onClose,
  onSuccess,
}: CreateNewsModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("ANNOUNCEMENT");
  const [coverImage, setCoverImage] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề bài viết.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createCommunityNewsFn({
        data: {
          communityId,
          title: title.trim(),
          category,
          coverImage: coverImage.trim() || undefined,
          excerpt: excerpt.trim() || undefined,
          content: content.trim() || undefined,
        },
      });

      if (res.ok) {
        toast.success("✓ Đã đăng bài viết thành công!", {
          description: "Bài viết đã được xuất bản tới toàn thể hội viên cộng đồng.",
        });
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Không thể đăng bài viết. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Create news error", err);
      toast.error("Đã xảy ra lỗi khi đăng bài viết.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-amber-500/40 bg-[#1A120B] text-white p-6 sm:p-7 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-500 border border-amber-500/40">
              <Newspaper className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-mono font-bold text-amber-500 uppercase tracking-wider">
              {communityName || "BẢN TIN CỘNG ĐỒNG"}
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-black dark:text-white mt-1.5">
            Đăng Bài Viết & Tin Tức
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
            Chia sẻ thông cáo, tin tức hoạt động và câu chuyện kinh doanh tới các hội viên.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tiêu đề bài viết */}
          <div>
            <label className="block text-xs font-bold text-black dark:text-white mb-1">
              Tiêu đề bài viết <span className="text-amber-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Hội nghị Xúc tiến Giao thương Quý 3/2026..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-white dark:bg-[#1A0F0A] text-black dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Chuyên mục & Ảnh bìa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-black dark:text-white mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-500" />
                <span>Chuyên mục</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-amber-500/30 bg-white dark:bg-[#1A0F0A] text-black dark:text-white text-xs focus:outline-none focus:border-amber-500"
              >
                {NEWS_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-white dark:bg-slate-900 text-black dark:text-white">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-black dark:text-white mb-1 flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-amber-500" />
                <span>Link Ảnh bìa (URL)</span>
              </label>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-white dark:bg-[#1A0F0A] text-black dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Tóm tắt bài viết */}
          <div>
            <label className="block text-xs font-bold text-black dark:text-white mb-1 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-amber-500" />
              <span>Tóm tắt ngắn (Excerpt)</span>
            </label>
            <textarea
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Đoạn tóm lược nội dung chính (1-2 câu) hiển thị trên danh sách tin..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-white dark:bg-[#1A0F0A] text-black dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Nội dung chi tiết */}
          <div>
            <label className="block text-xs font-bold text-black dark:text-white mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>Nội dung chi tiết bài viết</span>
            </label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập toàn bộ nội dung bài viết, kế hoạch, thông báo hoặc chương trình chi tiết..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-white dark:bg-[#1A0F0A] text-black dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-3 rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-full font-bold text-xs uppercase tracking-wider bg-[var(--bc-mobile-accent-grad)] text-black shadow-md hover:brightness-105 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Đang đăng...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-black" />
                  <span>Xuất bản bài viết</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
