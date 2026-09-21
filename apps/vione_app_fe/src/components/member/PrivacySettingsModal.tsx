import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Phone,
  Mail,
  MapPin,
  Building2,
  User,
  Image,
  Check,
  Sparkles,
  Info,
  Loader2,
  Lock,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { getCardSettings, saveCardSettings, type CardSettings } from "@/lib/card.functions";
import { useLang } from "@/lib/i18n";

interface PrivacySettingsModalProps {
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export function PrivacySettingsModal({ open, onClose, onUpdated }: PrivacySettingsModalProps) {
  const { lang } = useLang();
  const isEn = lang === "en";

  const fetchSettings = useServerFn(getCardSettings);
  const updateSettings = useServerFn(saveCardSettings);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Privacy toggles state
  const [showPhone, setShowPhone] = useState(true);
  const [showEmail, setShowEmail] = useState(true);
  const [showAddress, setShowAddress] = useState(true);
  const [showCompany, setShowCompany] = useState(true);
  const [showName, setShowName] = useState(true);
  const [showPhoto, setShowPhoto] = useState(true);
  const [showIndustry, setShowIndustry] = useState(true);
  const [showCompanySize, setShowCompanySize] = useState(true);
  const [showFeaturedProducts, setShowFeaturedProducts] = useState(true);

  // Load current settings
  useEffect(() => {
    if (!open) return;

    // Load from local storage cache first for instant response
    try {
      const cached = localStorage.getItem("vba_qr_privacy_settings");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (typeof parsed.showPhone === "boolean") setShowPhone(parsed.showPhone);
        if (typeof parsed.showEmail === "boolean") setShowEmail(parsed.showEmail);
        if (typeof parsed.showAddress === "boolean") setShowAddress(parsed.showAddress);
        if (typeof parsed.showCompany === "boolean") setShowCompany(parsed.showCompany);
        if (typeof parsed.showName === "boolean") setShowName(parsed.showName);
        if (typeof parsed.showPhoto === "boolean") setShowPhoto(parsed.showPhoto);
        if (typeof parsed.showIndustry === "boolean") setShowIndustry(parsed.showIndustry);
        if (typeof parsed.showCompanySize === "boolean") setShowCompanySize(parsed.showCompanySize);
        if (typeof parsed.showFeaturedProducts === "boolean") setShowFeaturedProducts(parsed.showFeaturedProducts);
      }
    } catch {
      /* ignore */
    }

    // Then fetch fresh from server
    setLoading(true);
    fetchSettings()
      .then((s) => {
        if (s) {
          setShowPhone(s.showPhone !== false);
          setShowEmail(s.showEmail !== false);
          setShowAddress(s.showAddress !== false);
          setShowCompany(s.showCompany !== false);
          setShowName(s.showName !== false);
          setShowPhoto(s.showPhoto !== false);

          localStorage.setItem(
            "vba_qr_privacy_settings",
            JSON.stringify({
              showPhone: s.showPhone !== false,
              showEmail: s.showEmail !== false,
              showAddress: s.showAddress !== false,
              showCompany: s.showCompany !== false,
              showName: s.showName !== false,
              showPhoto: s.showPhoto !== false,
            }),
          );
        }
      })
      .catch(() => {
        /* fallback to defaults */
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        showPhone,
        showEmail,
        showAddress,
        showCompany,
        showName,
        showPhoto,
        showIndustry,
        showCompanySize,
        showFeaturedProducts,
      };

      // Save to server
      await updateSettings({ data: payload });

      // Cache locally
      localStorage.setItem("vba_qr_privacy_settings", JSON.stringify(payload));
      window.dispatchEvent(new Event("vba_privacy_settings_updated"));

      toast.success(
        isEn
          ? "Privacy settings saved successfully!"
          : "Đã cập nhật quyền riêng tư khi quét mã QR!",
      );
      onUpdated?.();
      onClose();
    } catch (err: any) {
      // Even if server request fails, persist locally
      const payload = {
        showPhone,
        showEmail,
        showAddress,
        showCompany,
        showName,
        showPhoto,
        showIndustry,
        showCompanySize,
        showFeaturedProducts,
      };
      localStorage.setItem("vba_qr_privacy_settings", JSON.stringify(payload));
      window.dispatchEvent(new Event("vba_privacy_settings_updated"));

      toast.success(
        isEn
          ? "Privacy settings saved locally!"
          : "Đã lưu cài đặt quyền riêng tư!",
      );
      onUpdated?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setShowPhone(true);
    setShowEmail(true);
    setShowAddress(true);
    setShowCompany(true);
    setShowName(true);
    setShowPhoto(true);
    toast.info(isEn ? "Reset to all public" : "Đã đặt lại về hiển thị công khai toàn bộ");
  };

  const hiddenCount = [showPhone, showEmail, showAddress, showCompany, showName, showPhoto].filter(
    (v) => !v,
  ).length;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1329] text-slate-900 dark:text-white sm:rounded-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#19194D] via-[#003B95] to-[#0f4c9c] p-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-xs border border-white/25">
              <ShieldCheck className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white leading-tight">
                {isEn ? "Privacy & QR Visibility" : "Quyền riêng tư khi quét QR"}
              </DialogTitle>
              <DialogDescription className="text-xs text-white/80 mt-0.5">
                {isEn
                  ? "Control what information is displayed when others scan your card"
                  : "Quản lý trường thông tin hiển thị khi người khác quét thẻ"}
              </DialogDescription>
            </div>
          </div>

          {/* Privacy Status Badge */}
          <div className="mt-3 flex items-center justify-between rounded-lg bg-black/25 px-3 py-1.5 backdrop-blur-xs border border-white/10 text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              {hiddenCount === 0 ? (
                <>
                  <Eye className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-semibold">
                    {isEn ? "Fully Public" : "Công khai toàn bộ (Khuyên dùng)"}
                  </span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-amber-300 font-semibold">
                    {isEn ? `Protected (${hiddenCount} fields hidden)` : `Bảo vệ riêng tư (Đang ẩn ${hiddenCount} mục)`}
                  </span>
                </>
              )}
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] text-white/80 hover:text-white underline cursor-pointer"
            >
              {isEn ? "Reset" : "Mặc định"}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-[#003B95] mb-2" />
              <span className="text-xs">{isEn ? "Loading settings..." : "Đang tải cài đặt..."}</span>
            </div>
          ) : (
            <>
              <div className="rounded-xl bg-blue-50/70 dark:bg-blue-950/40 p-3 border border-blue-100 dark:border-blue-900/50 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                <Info className="h-4 w-4 text-[#003B95] dark:text-blue-400 shrink-0 mt-0.5" />
                <span>
                  {isEn
                    ? "When a field is hidden, partners scanning your QR will see 'Hidden by privacy settings' instead of your raw contact detail."
                    : "Khi bạn tắt hiển thị, người khác quét mã QR sẽ thấy 'Đã ẩn theo cài đặt riêng tư' thay vì số điện thoại hoặc email cá nhân."}
                </span>
              </div>

              {/* Toggles List */}
              <div className="space-y-2">
                {/* 1. Phone */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100/80 dark:hover:bg-slate-850 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isEn ? "Phone Number / Hotline" : "Số điện thoại / Hotline"}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isEn ? "Allow direct phone calls and Zalo chat" : "Cho phép gọi trực tiếp & kết nối Zalo"}
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showPhone}
                    onChange={(e) => setShowPhone(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#003B95] focus:ring-[#003B95] cursor-pointer"
                  />
                </label>

                {/* 2. Email */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100/80 dark:hover:bg-slate-850 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isEn ? "Email Address" : "Địa chỉ Email"}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isEn ? "Receive business inquiry via email" : "Nhận thư liên hệ & hợp tác kinh doanh"}
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showEmail}
                    onChange={(e) => setShowEmail(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#003B95] focus:ring-[#003B95] cursor-pointer"
                  />
                </label>

                {/* 3. Address */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100/80 dark:hover:bg-slate-850 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isEn ? "Office / Business Address" : "Địa chỉ văn phòng / Doanh nghiệp"}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isEn ? "Display office address on map" : "Hiển thị địa chỉ trụ sở công ty"}
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showAddress}
                    onChange={(e) => setShowAddress(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#003B95] focus:ring-[#003B95] cursor-pointer"
                  />
                </label>

                {/* 4. Company */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100/80 dark:hover:bg-slate-850 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isEn ? "Company / Enterprise Name" : "Tên Công ty / Doanh nghiệp"}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isEn ? "Show enterprise entity brand" : "Hiển thị tên đơn vị công tác"}
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showCompany}
                    onChange={(e) => setShowCompany(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#003B95] focus:ring-[#003B95] cursor-pointer"
                  />
                </label>

                {/* 5. Full Name */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100/80 dark:hover:bg-slate-850 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isEn ? "Full Member Name" : "Họ và tên hội viên"}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isEn ? "Show full personal name" : "Hiển thị danh tính hội viên"}
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showName}
                    onChange={(e) => setShowName(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#003B95] focus:ring-[#003B95] cursor-pointer"
                  />
                </label>

                {/* 6. Photo */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100/80 dark:hover:bg-slate-850 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                      <Image className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isEn ? "Avatar / Profile Photo" : "Ảnh đại diện (Avatar)"}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isEn ? "Show avatar photo on digital card" : "Hiển thị ảnh chân dung nhận diện"}
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showPhoto}
                    onChange={(e) => setShowPhoto(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#003B95] focus:ring-[#003B95] cursor-pointer"
                  />
                </label>

                {/* 7. Industry */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100/80 dark:hover:bg-slate-850 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isEn ? "Industry & Business Field" : "Lĩnh vực kinh doanh & Hoạt động"}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isEn ? "Show industry details on digital card" : "Hiển thị lĩnh vực chuyên sâu của doanh nghiệp"}
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showIndustry}
                    onChange={(e) => setShowIndustry(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#003B95] focus:ring-[#003B95] cursor-pointer"
                  />
                </label>

                {/* 8. Company Size */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100/80 dark:hover:bg-slate-850 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isEn ? "Employee Scale" : "Quy mô nhân viên"}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isEn ? "Show enterprise staff size" : "Hiển thị quy mô nhân sự của công ty"}
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showCompanySize}
                    onChange={(e) => setShowCompanySize(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#003B95] focus:ring-[#003B95] cursor-pointer"
                  />
                </label>

                {/* 9. Featured Products */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100/80 dark:hover:bg-slate-850 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isEn ? "Featured Products & Services" : "Sản phẩm / Dịch vụ nổi bật"}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isEn ? "Highlight flagship solutions on profile" : "Hiển thị giải pháp chủ lực trên danh thiếp"}
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showFeaturedProducts}
                    onChange={(e) => setShowFeaturedProducts(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#003B95] focus:ring-[#003B95] cursor-pointer"
                  />
                </label>
              </div>
            </>
          )}
        </div>

        {/* Action Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            {isEn ? "Cancel" : "Hủy"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            style={{ color: "#ffffff" }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#003B95] hover:bg-[#002B70] px-5 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                <span>{isEn ? "Saving..." : "Đang lưu..."}</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5 text-white" />
                <span>{isEn ? "Save Changes" : "Lưu cài đặt"}</span>
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
