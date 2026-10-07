import { useState, useRef } from "react";
import {
  X,
  Camera,
  Image as ImageIcon,
  Building2,
  Users2,
  Sparkles,
  Save,
  Loader2,
  Upload,
  Globe,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi, uploadFile } from "@/lib/api-client";

export interface EditCommunityModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  communityId: string;
  initialData?: {
    name: string;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    tagline?: string | null;
    about?: string | null;
    communityType?: "b2b_networking" | "company_internal";
  };
  currentName?: string;
  currentLogoUrl?: string | null;
  currentBannerUrl?: string | null;
  currentShortDescription?: string | null;
  currentDescription?: string | null;
  currentType?: "b2b_networking" | "company_internal";
  onUpdated?: () => void;
  onSuccess?: () => void;
}

export function EditCommunityModal({
  open,
  isOpen,
  onClose,
  communityId,
  initialData,
  currentName,
  currentLogoUrl,
  currentBannerUrl,
  currentShortDescription,
  currentDescription,
  currentType,
  onUpdated,
  onSuccess,
}: EditCommunityModalProps) {
  const isModalOpen = open ?? isOpen ?? false;
  const [name, setName] = useState(initialData?.name || currentName || "");
  const [tagline, setTagline] = useState(initialData?.tagline || currentShortDescription || "");
  const [about, setAbout] = useState(initialData?.about || currentDescription || "");
  const [communityType, setCommunityType] = useState<"b2b_networking" | "company_internal">(
    initialData?.communityType || currentType || "b2b_networking"
  );
  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl || currentLogoUrl || "");
  const [bannerUrl, setBannerUrl] = useState(initialData?.bannerUrl || currentBannerUrl || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const logoFileRef = useRef<HTMLInputElement>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);

  if (!isModalOpen) return null;

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const url = await uploadFile(file, file.name || "logo.png");
      if (url) {
        setLogoUrl(url);
        toast.success("Tải ảnh đại diện cộng đồng thành công!");
      }
    } catch {
      toast.error("Không thể tải ảnh. Vui lòng thử lại!");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    try {
      const url = await uploadFile(file, file.name || "banner.jpg");
      if (url) {
        setBannerUrl(url);
        toast.success("Tải ảnh bìa cộng đồng thành công!");
      }
    } catch {
      toast.error("Không thể tải ảnh bìa. Vui lòng thử lại!");
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Tên cộng đồng không được để trống!");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        tagline: tagline.trim() || null,
        about: about.trim() || null,
        logoUrl: logoUrl.trim() || null,
        bannerUrl: bannerUrl.trim() || null,
        communityType,
      };

      await fetchNestApi(`/connect-app/community/${communityId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      toast.success("Đã cập nhật thông tin cộng đồng thành công!");
      if (onUpdated) onUpdated();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Không thể cập nhật thông tin. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-t-[28px] sm:rounded-3xl border border-[#DFB76C]/40 bg-[#0B0F17] text-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-[#151D2C] via-[#0E1522] to-[#151D2C]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#DFB76C] to-[#8C653B] text-black shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#F6E1C3]">
                Quản Trị & Chỉnh Sửa Cộng Đồng
              </h2>
              <p className="text-[11px] text-slate-400">
                Quyền hạn dành riêng cho Ban Quản Trị / Quản Trị Viên
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition active:scale-95 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 [scrollbar-width:none]">
          {/* Banner & Avatar Upload Section */}
          <div>
            <label className="block text-[12px] font-bold uppercase tracking-wider text-[#DFB76C] mb-2">
              Ảnh Bìa & Ảnh Đại Diện
            </label>
            <div className="relative h-32 w-full rounded-2xl overflow-hidden border border-[#DFB76C]/30 bg-slate-900 group">
              {bannerUrl ? (
                <img
                  src={bannerUrl}
                  alt="Ảnh bìa"
                  className="h-full w-full object-cover brightness-[0.85]"
                />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
                  <ImageIcon className="h-8 w-8 text-slate-600 mb-1" />
                  <span className="text-[11px]">Chưa có ảnh bìa</span>
                </div>
              )}

              {/* Upload Banner Button */}
              <button
                type="button"
                onClick={() => bannerFileRef.current?.click()}
                disabled={isUploadingBanner}
                className="absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-black/70 hover:bg-black text-[#F6E1C3] border border-[#DFB76C]/50 backdrop-blur-md shadow-md transition active:scale-95 cursor-pointer"
              >
                {isUploadingBanner ? (
                  <Loader2 className="h-3 w-3 animate-spin text-[#DFB76C]" />
                ) : (
                  <Camera className="h-3 w-3 text-[#DFB76C]" />
                )}
                <span>Đổi ảnh bìa</span>
              </button>
              <input
                ref={bannerFileRef}
                type="file"
                accept="image/*"
                onChange={handleUploadBanner}
                className="hidden"
              />

              {/* Avatar Floating */}
              <div className="absolute -bottom-1 left-4 translate-y-1/4 z-10">
                <div className="relative h-16 w-16 rounded-2xl overflow-hidden border-2 border-[#DFB76C] bg-slate-950 shadow-xl group/avatar">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center bg-gradient-to-tr from-[#D8B282] to-[#8C653B] text-black font-black text-sm">
                      {name.slice(0, 2).toUpperCase() || "VO"}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => logoFileRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition cursor-pointer text-white"
                  >
                    {isUploadingLogo ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#DFB76C]" />
                    ) : (
                      <Camera className="h-4 w-4 text-[#DFB76C]" />
                    )}
                  </button>
                  <input
                    ref={logoFileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadLogo}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
            <div className="mt-7 text-right">
              <button
                type="button"
                onClick={() => logoFileRef.current?.click()}
                className="text-[11px] font-semibold text-[#DFB76C] hover:underline cursor-pointer"
              >
                + Bấm vào đây để đổi ảnh đại diện (Logo)
              </button>
            </div>
          </div>

          {/* Phân loại kiểu cộng đồng (B2B vs Doanh Nghiệp Nội Bộ) */}
          <div className="pt-2">
            <label className="block text-[12px] font-bold uppercase tracking-wider text-[#DFB76C] mb-2">
              Mô Hình & Phân Loại Cộng Đồng
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setCommunityType("b2b_networking")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  communityType === "b2b_networking"
                    ? "border-[#DFB76C] bg-gradient-to-br from-[#DFB76C]/15 to-transparent text-[#F6E1C3] shadow-md ring-1 ring-[#DFB76C]/40"
                    : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-[12.5px]">
                  <Users2 className="h-4 w-4 text-[#DFB76C]" />
                  <span>Mạng Lưới B2B</span>
                </div>
                <p className="mt-1 text-[10.5px] leading-tight text-slate-400">
                  Đăng cơ hội giao thương, share sự kiện đối tác, kết nối doanh nhân
                </p>
              </button>

              <button
                type="button"
                onClick={() => setCommunityType("company_internal")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  communityType === "company_internal"
                    ? "border-[#DFB76C] bg-gradient-to-br from-[#DFB76C]/15 to-transparent text-[#F6E1C3] shadow-md ring-1 ring-[#DFB76C]/40"
                    : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-[12.5px]">
                  <Building2 className="h-4 w-4 text-[#DFB76C]" />
                  <span>Doanh Nghiệp Nội Bộ</span>
                </div>
                <p className="mt-1 text-[10.5px] leading-tight text-slate-400">
                  Giao việc nhân viên, nhận việc 1-chạm, giám sát chăm sóc CRM
                </p>
              </button>
            </div>
          </div>

          {/* Tên cộng đồng */}
          <div>
            <label className="block text-[12px] font-bold text-slate-300 mb-1.5">
              Tên Cộng Đồng / Doanh Nghiệp <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Gia Đình ViOne, CLB Doanh Nhân..."
              className="w-full h-11 px-3.5 rounded-xl border border-white/15 bg-slate-900/90 text-white placeholder-slate-500 focus:border-[#DFB76C] focus:outline-hidden text-[13px] font-semibold"
            />
          </div>

          {/* Khẩu hiệu / Tagline */}
          <div>
            <label className="block text-[12px] font-bold text-slate-300 mb-1.5">
              Khẩu Hiệu / Tagline Ngắn
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="VD: Kết nối sức mạnh doanh nhân - Đồng hành cùng phát triển"
              className="w-full h-11 px-3.5 rounded-xl border border-white/15 bg-slate-900/90 text-white placeholder-slate-500 focus:border-[#DFB76C] focus:outline-hidden text-[13px]"
            />
          </div>

          {/* Giới thiệu chi tiết */}
          <div>
            <label className="block text-[12px] font-bold text-slate-300 mb-1.5">
              Giới Thiệu Chi Tiết (About)
            </label>
            <textarea
              rows={3}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Mô tả tầm nhìn, sứ mệnh, quyền lợi hội viên và quy chế hoạt động..."
              className="w-full p-3 rounded-xl border border-white/15 bg-slate-900/90 text-white placeholder-slate-500 focus:border-[#DFB76C] focus:outline-hidden text-[13px] leading-relaxed resize-none"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2 pb-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-bold text-[13.5px] bg-gradient-to-r from-[#F6E1C3] via-[#D8B282] to-[#B88E4C] text-[#050811] shadow-lg hover:brightness-105 active:scale-98 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-black" />
                  <span>Đang lưu thay đổi...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 text-black" />
                  <span>Lưu & Cập Nhật Cộng Đồng</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
