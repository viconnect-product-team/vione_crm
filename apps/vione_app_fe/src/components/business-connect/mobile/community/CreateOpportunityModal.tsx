import React, { useState } from "react";
import { X, Sparkles, DollarSign, Calendar, Phone, Briefcase, Tag, FileText, Loader2, CheckCircle2 } from "lucide-react";
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
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

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
        },
      });

      if (res.ok) {
        toast.success("✓ Đã đăng cơ hội kinh doanh thành công!", {
          description: "Cơ hội đã được phát sóng lên sàn giao thương cộng đồng.",
        });
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Không thể đăng cơ hội. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Create opportunity error", err);
      toast.error("Đã xảy ra lỗi khi đăng cơ hội.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#D8B282]/40 bg-[#0B132B] text-white p-6 sm:p-7 shadow-2xl overflow-y-auto max-h-[90vh]">
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
            <span className="p-1.5 rounded-lg bg-[#D8B282]/20 text-[#F6E1C3] border border-[#D8B282]/40">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-mono font-bold text-[#D8B282] uppercase tracking-wider">
              {communityName || "SÀN GIAO THƯƠNG B2B"}
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mt-1.5">
            Đăng Cơ Hội Kinh Doanh
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Kết nối trực tiếp nhu cầu cung - cầu với 200+ lãnh đạo và doanh nghiệp trong hiệp hội.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tiêu đề cơ hội */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">
              Tiêu đề cơ hội kinh doanh <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Cần tìm nhà cung ứng bao bì xuất khẩu tiêu chuẩn EU..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8B282]/30 bg-black/50 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-[#D8B282]"
              />
            </div>
          </div>

          {/* Phân loại & Ngân sách */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#D8B282]" />
                <span>Loại cơ hội</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#D8B282]/30 bg-black/60 text-white text-xs focus:outline-none focus:border-[#D8B282]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-[#0B132B]">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                <span>Ngân sách / Quy mô deal</span>
              </label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="VD: 500 Triệu - 2 Tỷ VNĐ"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8B282]/30 bg-black/50 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-[#D8B282]"
              />
            </div>
          </div>

          {/* Ngành nghề & Hạn chót */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Ngành nghề</span>
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="VD: Nông sản, Bất động sản, AI..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8B282]/30 bg-black/50 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-[#D8B282]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Hạn chót tiếp nhận</span>
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#D8B282]/30 bg-black/50 text-white text-xs focus:outline-none focus:border-[#D8B282]"
              />
            </div>
          </div>

          {/* Hotline liên hệ */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#F6E1C3]" />
              <span>Số điện thoại / Hotline liên hệ trực tiếp</span>
            </label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="VD: 0988 123 456"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8B282]/30 bg-black/50 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-[#D8B282]"
            />
          </div>

          {/* Mô tả chi tiết */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#D8B282]" />
              <span>Mô tả chi tiết yêu cầu & tiêu chuẩn đối tác</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả cụ thể về số lượng, tiêu chuẩn chất lượng, địa điểm giao hàng hoặc hình thức hợp tác mong muốn..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8B282]/30 bg-black/50 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-[#D8B282] resize-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-3 rounded-full border border-white/20 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
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
