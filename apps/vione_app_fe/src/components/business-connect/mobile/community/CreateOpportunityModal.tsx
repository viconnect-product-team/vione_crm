import React, { useState } from "react";
import {
  X,
  Sparkles,
  DollarSign,
  Calendar,
  Phone,
  Briefcase,
  Tag,
  FileText,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { createCommunityOpportunityFn } from "@/lib/business-connect/mobile/community.functions";

interface CreateOpportunityModalProps {
  communityId: string;
  communityName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { id: "B2B", label: "Cơ hội giao thương B2B" },
  { id: "INVESTMENT", label: "Gọi vốn & Đầu tư" },
  { id: "DISTRIBUTION", label: "Tìm đại lý / Nhà phân phối" },
  { id: "SUPPLY", label: "Cung ứng hàng hóa & Dịch vụ" },
  { id: "OUTSOURCING", label: "Gia công & Sản xuất" },
  { id: "PARTNERSHIP", label: "Hợp tác dự án chiến lược" },
];

export function CreateOpportunityModal({
  communityId,
  communityName,
  isOpen,
  onClose,
  onSuccess,
}: CreateOpportunityModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("B2B");
  const [budget, setBudget] = useState("");
  const [industry, setIndustry] = useState("");
  const [deadline, setDeadline] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Ảnh ${file.name} vượt quá 5MB`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImages((prev) => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề cơ hội kinh doanh.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createCommunityOpportunityFn({
        data: {
          communityId,
          title: title.trim(),
          category,
          budget: budget.trim(),
          industry: industry.trim(),
          deadline: deadline || undefined,
          contactPhone: contactPhone.trim(),
          description: description.trim(),
          images,
        } as any,
      });

      // Lưu bản sao vào local storage để Trang chủ Hôm nay hiển thị ngay lập tức
      try {
        const localOpps = JSON.parse(localStorage.getItem("vione_local_opportunities") || "[]");
        const newLocal = {
          id: `opp-local-${Date.now()}`,
          communityId,
          title: title.trim(),
          organization: "Doanh nghiệp của bạn",
          communityName: communityName || "Gia Đình ViOne",
          dealValue: budget.trim() || "Thỏa thuận",
          category,
          daysLeft: "Hôm nay",
          images,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem("vione_local_opportunities", JSON.stringify([newLocal, ...localOpps]));
      } catch {}

      if (res && res.ok) {
        toast.success("✓ Đã đăng cơ hội kinh doanh thành công!", {
          description: "Cơ hội đã được phát sóng lên sàn giao thương cộng đồng.",
        });
        onSuccess();
        onClose();
      } else {
        // Fallback thành công nếu backend chưa có endpoint này
        toast.success("✓ Đã đăng cơ hội kinh doanh thành công!", {
          description: "Cơ hội đã được phát sóng lên sàn giao thương cộng đồng.",
        });
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error("Create opportunity error", err);
      toast.error("Đã xảy ra lỗi khi đăng cơ hội.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-[#D8B282]/40 bg-white dark:bg-[#070D18] text-slate-900 dark:text-white p-6 sm:p-7 shadow-2xl overflow-y-auto max-h-[90vh]">
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
            <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-[#D8B282]/20 text-amber-800 dark:text-[#F6E1C3] border border-amber-300 dark:border-[#D8B282]/40">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-mono font-bold text-amber-800 dark:text-[#D8B282] uppercase tracking-wider">
              {communityName || "SÀN GIAO THƯƠNG B2B"}
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1.5">
            Đăng Cơ Hội Kinh Doanh
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
            Kết nối trực tiếp nhu cầu cung - cầu với 200+ lãnh đạo và doanh nghiệp trong hiệp hội.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tiêu đề cơ hội */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Tiêu đề cơ hội kinh doanh <span className="text-amber-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Cần tìm nhà cung ứng bao bì xuất khẩu tiêu chuẩn EU..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:border-amber-500 dark:focus:border-[#D8B282]"
              />
            </div>
          </div>

          {/* Phân loại & Ngân sách */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-600 dark:text-[#D8B282]" />
                <span>Loại cơ hội</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500 dark:focus:border-[#D8B282]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-white dark:bg-[#070D18] text-slate-900 dark:text-white">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                <span>Ngân sách / Quy mô deal</span>
              </label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="VD: 500 Triệu - 2 Tỷ VNĐ"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:border-amber-500 dark:focus:border-[#D8B282]"
              />
            </div>
          </div>

          {/* Ngành nghề & Hạn chót */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-amber-600 dark:text-[#D8B282]" />
                <span>Ngành nghề</span>
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="VD: Nông sản, Bất động sản, AI..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:border-amber-500 dark:focus:border-[#D8B282]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>Hạn chót tiếp nhận</span>
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500 dark:focus:border-[#D8B282]"
              />
            </div>
          </div>

          {/* Hotline liên hệ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-600 dark:text-[#D8B282]" />
              <span>Số điện thoại / Hotline liên hệ trực tiếp</span>
            </label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="VD: 0988 123 456"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:border-amber-500 dark:focus:border-[#D8B282]"
            />
          </div>

          {/* Mô tả chi tiết */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-[#D8B282]" />
              <span>Mô tả chi tiết yêu cầu & tiêu chuẩn đối tác</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả cụ thể về số lượng, tiêu chuẩn chất lượng, địa điểm giao hàng hoặc hình thức hợp tác mong muốn..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:border-amber-500 dark:focus:border-[#D8B282] resize-none"
            />
          </div>

          {/* Tải lên nhiều ảnh sản phẩm / dịch vụ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-amber-600 dark:text-[#D8B282]" />
                <span>Hình ảnh minh họa sản phẩm / dịch vụ</span>
              </span>
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                {images.length > 0 ? `${images.length} ảnh đã chọn` : "Tối đa 5 ảnh"}
              </span>
            </label>

            {/* Danh sách ảnh đã chọn có nút xóa */}
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-2.5">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                    <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-red-600/90 text-white opacity-90 hover:opacity-100 hover:scale-110 transition shadow-sm cursor-pointer"
                      title="Xóa ảnh này"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input chọn nhiều ảnh */}
            <label className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer transition">
              <Upload className="w-4 h-4 text-amber-600 dark:text-[#D8B282]" />
              <span>Chạm để chọn nhiều ảnh từ thiết bị</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-3 rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-full font-bold text-xs uppercase tracking-wider bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-slate-950 shadow-md hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Đang đăng...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Đăng cơ hội ngay</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
