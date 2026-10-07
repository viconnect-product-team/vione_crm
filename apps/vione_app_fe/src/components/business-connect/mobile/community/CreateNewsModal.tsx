import React, { useState, useRef } from "react";
import { X, Sparkles, Newspaper, Image as ImageIcon, FileText, AlignLeft, Tag, Loader2, CheckCircle2, Upload } from "lucide-react";
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
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newImgs: string[] = [];
    const count = files.length;
    let loaded = 0;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newImgs.push(e.target.result as string);
        }
        loaded++;
        if (loaded === count) {
          setUploadedImages((prev) => [...prev, ...newImgs]);
          toast.success(`Đã thêm ${newImgs.length} ảnh vào bài viết!`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề bài viết.");
      return;
    }

    setSubmitting(true);
    try {
      const mainCover = uploadedImages.length > 0 ? uploadedImages[0] : undefined;
      const res = await createCommunityNewsFn({
        data: {
          communityId,
          title: title.trim(),
          category,
          coverImage: mainCover,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-amber-500/40 bg-white dark:bg-[#121824] text-slate-900 dark:text-white p-6 sm:p-7 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500 border border-amber-500/30">
              <Newspaper className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">
              {communityName || "BẢN TIN CỘNG ĐỒNG"}
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1.5">
            Đăng Bài Viết & Tin Tức
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Chia sẻ thông cáo, tin tức hoạt động và câu chuyện kinh doanh tới các hội viên.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tiêu đề bài viết */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Tiêu đề bài viết <span className="text-amber-600 dark:text-amber-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Hội nghị Xúc tiến Giao thương Quý 3/2026..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Chuyên mục */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
              <span>Chuyên mục</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
            >
              {NEWS_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Nút tải ảnh lên & hỗ trợ nhiều ảnh */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                <span>Ảnh đính kèm ({uploadedImages.length})</span>
              </span>
              <span className="text-[11px] font-normal text-slate-500">Hỗ trợ chọn nhiều ảnh</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageFiles(e.target.files)}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 rounded-xl border border-dashed border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Tải ảnh lên từ thiết bị (Hỗ trợ nhiều ảnh)</span>
            </button>

            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2.5">
                {uploadedImages.map((imgSrc, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video border border-slate-200 dark:border-slate-700">
                    <img src={imgSrc} alt={`upload-${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-90 hover:opacity-100 transition cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tóm tắt bài viết */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
              <span>Tóm tắt ngắn (Excerpt)</span>
            </label>
            <textarea
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Đoạn tóm lược nội dung chính (1-2 câu) hiển thị trên danh sách tin..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Nội dung chi tiết */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
              <span>Nội dung chi tiết bài viết</span>
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập toàn bộ nội dung bài viết, kế hoạch, thông báo hoặc chương trình chi tiết..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Đang đăng...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
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
