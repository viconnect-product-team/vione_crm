import { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Phone,
  Mail,
  MapPin,
  Send,
  MessageSquare,
  Building2,
  CheckCircle2,
  Headphones,
  ExternalLink,
  Users,
  ShieldCheck,
  TrendingUp,
  Crown,
  Laptop,
  Scale,
  Sparkles,
  Award,
} from "lucide-react";
import { toast } from "sonner";

export interface ContactSupportModalProps {
  open: boolean;
  onClose: () => void;
}

interface CommitteeItem {
  id: string;
  name: string;
  leader: string;
  role: string;
  phone: string;
  email: string;
  icon: typeof Building2;
  color: string;
  bgLight: string;
  description: string;
}

const COMMITTEES: CommitteeItem[] = [
  {
    id: "thuong-truc",
    name: "Ban Thường Trực CLB",
    leader: "Anh Lê Xuân Tùng",
    role: "Chủ tịch CLB Doanh Nhân CEO 1983",
    phone: "098.1983.888",
    email: "chutich@ceo1983.vn",
    icon: Crown,
    color: "#D97706",
    bgLight: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40",
    description: "Điều hành chung, hoạch định chiến lược phát triển và đại diện đối ngoại cấp cao.",
  },
  {
    id: "thu-ky",
    name: "Ban Thư Ký & Điều Phối Hội Viên",
    leader: "Chị Nguyễn Thị Bích Ngọc",
    role: "Tổng Thư Ký CLB",
    phone: "098.333.1983",
    email: "banthuky@ceo1983.vn",
    icon: Headphones,
    color: "#0284C7",
    bgLight: "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/40",
    description: "Tiếp nhận hồ sơ, hỗ trợ kỹ thuật app 24/7, vận hành kết nối thường nhật.",
  },
  {
    id: "xuc-tien",
    name: "Ban Xúc Tiến Thương Mại & Đầu Tư B2B",
    leader: "Anh Trần Đăng Khoa",
    role: "Phó Chủ Tịch Thường Trực",
    phone: "091.234.1983",
    email: "xuctienthuongmai@ceo1983.vn",
    icon: TrendingUp,
    color: "#059669",
    bgLight: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40",
    description: "Khớp nối chuỗi cung ứng, xúc tiến mua bán chéo B2B và cơ hội đầu tư doanh nghiệp.",
  },
  {
    id: "phat-trien",
    name: "Ban Phát Triển Hội Viên & Thẩm Định",
    leader: "Anh Hoàng Minh Thắng",
    role: "Phó Chủ Tịch CLB",
    phone: "090.888.1983",
    email: "hoivien@ceo1983.vn",
    icon: Users,
    color: "#4F46E5",
    bgLight: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/40",
    description: "Thẩm định tiêu chuẩn gia nhập, xác thực năng lực pháp lý và hồ sơ hội viên mới.",
  },
  {
    id: "truyen-thong",
    name: "Ban Truyền Thông & Sự Kiện",
    leader: "Chị Vũ Mai Hương",
    role: "Trưởng Ban Truyền Thông",
    phone: "097.666.1983",
    email: "truyenthong@ceo1983.vn",
    icon: Sparkles,
    color: "#DB2777",
    bgLight: "bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800/40",
    description: "Tổ chức Gala thường niên, Caravan, Cafe Doanh nhân và lan tỏa thương hiệu hội viên.",
  },
  {
    id: "tai-chinh",
    name: "Ban Tài Chính & Pháp Chế",
    leader: "Anh Phạm Hồng Quang",
    role: "Trưởng Ban Pháp Chế",
    phone: "094.555.1983",
    email: "taichinh.phapche@ceo1983.vn",
    icon: Scale,
    color: "#EA580C",
    bgLight: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/40",
    description: "Quản trị ngân sách, thu chi hội phí minh bạch, bảo trợ pháp lý và sở hữu trí tuệ.",
  },
  {
    id: "chuyen-doi-so",
    name: "Ban Đào Tạo & Chuyển Đổi Số",
    leader: "Anh Đặng Quốc Bảo",
    role: "Trưởng Ban Chuyển Đổi Số",
    phone: "093.222.1983",
    email: "chuyendoiso@ceo1983.vn",
    icon: Laptop,
    color: "#7C3AED",
    bgLight: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/40",
    description: "Ứng dụng công nghệ AI/CRM, tối ưu hóa nền tảng số hiệp hội và đào tạo quản trị.",
  },
];

export function ContactSupportModal({ open, onClose }: ContactSupportModalProps) {
  const [activeTab, setActiveTab] = useState<"committees" | "form">("committees");
  const [topic, setTopic] = useState("ky-thuat");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (!open || typeof document === "undefined") return null;

  const filteredCommittees = COMMITTEES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.leader.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung cần hỗ trợ");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setContent("");
      toast.success("Ban Thư Ký đã tiếp nhận yêu cầu! Chúng tôi sẽ phản hồi trong vòng 15 phút.");
      onClose();
    }, 600);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-lg max-h-[90vh] rounded-3xl bg-white dark:bg-[#0c1427] text-slate-900 dark:text-white shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#003B95]/10 text-[#003B95] dark:text-amber-400 border border-[#003B95]/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
                DANH BẠ BAN NGÀNH & LIÊN HỆ
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                CLB Doanh Nhân CEO 1983 • HanoiBA
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-4 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("committees")}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "committees"
                ? "border-[#003B95] text-[#003B95] dark:border-amber-400 dark:text-amber-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>7 Ban Chuyên Môn ({COMMITTEES.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("form")}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "form"
                ? "border-[#003B95] text-[#003B95] dark:border-amber-400 dark:text-amber-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800"
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            <span>Gửi Yêu Cầu Hỗ Trợ</span>
          </button>
        </div>

        {/* Scrollable Center Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 [scrollbar-width:thin]">
          {activeTab === "committees" && (
            <>
              {/* Quick Search */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm ban ngành, lãnh đạo phụ trách..."
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#003B95]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Committee Cards List */}
              <div className="space-y-2.5">
                {filteredCommittees.map((c) => {
                  const Icon = c.icon;
                  return (
                    <div
                      key={c.id}
                      className={`rounded-2xl border p-3 transition shadow-xs ${c.bgLight}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div
                            className="grid h-9 w-9 place-items-center rounded-xl shrink-0 text-white shadow-xs"
                            style={{ backgroundColor: c.color }}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                              {c.name}
                            </h3>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                                {c.leader}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                • {c.role}
                              </span>
                            </div>
                            <p className="mt-1 text-[10.5px] text-slate-600 dark:text-slate-300 leading-snug">
                              {c.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Contact Actions for this committee */}
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <a
                            href={`tel:${c.phone.replace(/\./g, "")}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10.5px] font-bold hover:bg-emerald-500/25 transition shrink-0"
                          >
                            <Phone className="h-3 w-3" />
                            <span>{c.phone}</span>
                          </a>

                          <a
                            href={`mailto:${c.email}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[10.5px] font-bold hover:bg-blue-500/25 transition truncate"
                          >
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{c.email}</span>
                          </a>
                        </div>

                        <a
                          href="https://zalo.me/ceo1983"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-[10px] font-semibold hover:bg-slate-200 transition shrink-0 flex items-center gap-1"
                        >
                          <span>Zalo</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Secretariat Office Address */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      Trụ sở Ban Thư Ký CLB Doanh Nhân CEO 1983:
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Tầng 6, Tháp Doanh Nhân, Đường Phạm Hùng, Phường Mễ Trì, Quận Nam Từ Liêm, Hà Nội.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "form" && (
            <div className="space-y-3.5">
              {/* Quick Contact Cards */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="tel:0983331983"
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] hover:border-emerald-500 transition"
                >
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/15 text-emerald-600 shrink-0">
                    <Phone className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9.5px] text-slate-500">Hotline 24/7</p>
                    <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">098.333.1983</p>
                  </div>
                </a>

                <a
                  href="mailto:banthuky@ceo1983.vn"
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] hover:border-blue-500 transition"
                >
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-blue-500/15 text-blue-600 shrink-0">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9.5px] text-slate-500">Hòm thư</p>
                    <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">banthuky@ceo1983.vn</p>
                  </div>
                </a>
              </div>

              {/* Form */}
              <form id="contact-support-form" onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                    Ban ngành tiếp nhận hỗ trợ:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "ky-thuat", label: "Kỹ thuật App" },
                      { id: "hoi-vien", label: "Hồ sơ Hội viên" },
                      { id: "giao-thuong", label: "Xúc tiến B2B" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTopic(opt.id)}
                        className={`rounded-xl py-2 px-1.5 text-[10.5px] font-bold border transition text-center cursor-pointer ${
                          topic === opt.id
                            ? "border-[#003B95] dark:border-amber-400 bg-blue-50 dark:bg-blue-950/50 text-[#003B95] dark:text-amber-300"
                            : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                    Nội dung yêu cầu / Góp ý:
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Mô tả cụ thể vấn đề hoặc đề xuất của Quý CEO..."
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#003B95] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#003B95] hover:bg-[#002B70] py-2.5 text-xs font-bold text-white shadow-md shadow-[#003B95]/20 active:scale-98 transition cursor-pointer disabled:opacity-60"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{submitting ? "Đang gửi..." : "Gửi Yêu Cầu Tới Ban Thư Ký"}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
