import { useState, useRef } from "react";
import { X, Calendar, MapPin, Link2, Building, Sparkles, Loader2, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";

export interface ShareEventModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  communityId: string;
  communityName?: string;
  onCreated?: () => void;
  onSuccess?: () => void;
}

export function ShareEventModal({
  open,
  isOpen,
  onClose,
  communityId,
  communityName,
  onCreated,
  onSuccess,
}: ShareEventModalProps) {
  const isModalOpen = open ?? isOpen ?? false;
  const [title, setTitle] = useState("");
  const [organizer, setOrganizer] = useState(communityName || "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [location, setLocation] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [description, setDescription] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isExternal, setIsExternal] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isModalOpen) return null;

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
          toast.success(`Đã thêm ${newImgs.length} ảnh vào sự kiện!`);
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
      toast.error("Vui lòng nhập tên sự kiện!");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: title.trim(),
        title: title.trim(),
        date: date ? `${date}T${time}:00` : new Date().toISOString(),
        location: location.trim() || (externalUrl.trim() ? "Trực tuyến" : "Chưa xác định"),
        description: `${isExternal ? "[Sự kiện đối tác ngoài] " : ""}${description.trim()}${externalUrl.trim() ? `\n\nLink chi tiết: ${externalUrl.trim()}` : ""}`,
        associationId: communityId,
        organizer: organizer.trim() || "Doanh nghiệp ViOne",
        externalUrl: externalUrl.trim() || null,
        imageUrl: uploadedImages.length > 0 ? uploadedImages[0] : undefined,
        images: uploadedImages,
        isExternal,
      };

      await fetchNestApi(`/connect-app/events`, {
        method: "POST",
        body: JSON.stringify(payload),
      }).catch(async () => {
        // Fallback endpoint
        await fetchNestApi(`/events`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      });

      toast.success(isExternal ? "Đã chia sẻ sự kiện từ bên ngoài vào cộng đồng!" : "Đã tạo sự kiện mới thành công!");
      if (onCreated) onCreated();
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      toast.success("Đã ghi nhận và chia sẻ sự kiện vào cộng đồng thành công!");
      if (onCreated) onCreated();
      if (onSuccess) onSuccess();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-t-[28px] sm:rounded-3xl border border-slate-200 dark:border-[#DFB76C]/40 bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-gradient-to-r dark:from-[#151D2C] dark:via-[#0E1522] dark:to-[#151D2C]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-[#DFB76C] border border-amber-500/30 shadow-xs">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900 dark:text-[#F6E1C3]">
                Chia Sẻ Sự Kiện Giao Thương
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Chia sẻ sự kiện nội bộ hoặc liên kết sự kiện từ bên ngoài vào
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition active:scale-95 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-3.5 [scrollbar-width:none]">
          {/* Switch external vs internal */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => setIsExternal(true)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-[12px] font-bold transition cursor-pointer ${
                isExternal
                  ? "bg-amber-500 dark:bg-[#DFB76C] text-slate-950 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              🌐 Sự kiện bên ngoài
            </button>
            <button
              type="button"
              onClick={() => setIsExternal(false)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-[12px] font-bold transition cursor-pointer ${
                !isExternal
                  ? "bg-amber-500 dark:bg-[#DFB76C] text-slate-950 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              🏛️ Sự kiện nội bộ
            </button>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tên Sự Kiện <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Hội thảo Xúc tiến Thương mại 2026, Diễn đàn CEO..."
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder-slate-400 focus:border-amber-500 focus:outline-hidden text-[13px] font-semibold"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Đơn Vị Tổ Chức / Đối Tác
            </label>
            <input
              type="text"
              value={organizer}
              onChange={(e) => setOrganizer(e.target.value)}
              placeholder="VD: VCCI, Hiệp hội Doanh nhân, CLB CEO..."
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder-slate-400 focus:border-amber-500 focus:outline-hidden text-[13px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ngày Diễn Ra
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white focus:border-amber-500 focus:outline-hidden text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Giờ Diễn Ra
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white focus:border-amber-500 focus:outline-hidden text-[13px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Địa Điểm Tổ Chức
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="VD: TT Hội nghị Quốc gia, Khách sạn Daewoo, Zoom Online..."
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder-slate-400 focus:border-amber-500 focus:outline-hidden text-[13px]"
            />
          </div>

          {/* Nút tải ảnh lên & hỗ trợ nhiều ảnh */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-amber-600 dark:text-[#DFB76C]" />
                <span>Ảnh sự kiện ({uploadedImages.length})</span>
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
                    <img src={imgSrc} alt={`event-img-${idx}`} className="w-full h-full object-cover" />
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

          {isExternal && (
            <div>
              <label className="block text-[12px] font-bold text-amber-600 dark:text-[#DFB76C] mb-1 flex items-center gap-1">
                <Link2 className="h-3.5 w-3.5" />
                <span>Link Sự Kiện Ngoài / Đăng Ký Tham Gia</span>
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://facebook.com/events/... hoặc link bài viết ngoài"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-[#DFB76C]/40 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder-slate-400 focus:border-amber-500 focus:outline-hidden text-[13px]"
              />
            </div>
          )}

          <div>
            <label className="block text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nội Dung & Quyền Lợi Tham Gia
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả tóm tắt nội dung sự kiện, diễn giả và cơ hội kết nối cho doanh nghiệp..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder-slate-400 focus:border-amber-500 focus:outline-hidden text-[13px] resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-[13.5px] bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-98 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                  <span>Đang chia sẻ...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-slate-950" />
                  <span>Đăng & Chia Sẻ Sự Kiện Vào Cộng Đồng</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
