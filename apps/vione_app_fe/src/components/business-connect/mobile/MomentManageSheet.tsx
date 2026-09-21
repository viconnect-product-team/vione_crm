// BC-Mobile — Modal Chỉnh sửa khoảnh khắc toàn diện (Facebook-Grade Moment Editor).
// Hỗ trợ sửa toàn bộ thông tin như lúc tạo mới: Nội dung, Quản lý ảnh (giữ ảnh cũ, thêm ảnh mới, xóa ảnh),
// Gắn thẻ đối tác (@tag), Chọn cảm xúc/hoạt động kinh doanh, Check-in địa điểm, Quyền riêng tư, Thời điểm & Xóa bài.

import { useEffect, useRef, useState } from "react";
import {
  X,
  Image as ImageIcon,
  Users,
  Smile,
  MapPin,
  Globe,
  Lock,
  UserCheck,
  Loader2,
  Check,
  Search,
  Sparkles,
  Trash2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";
import { useBusinessConnectNetwork } from "@/hooks/use-business-connect-network";
import { uploadFileToNest } from "@/lib/api-client";
import { avatarOrDemo } from "@/lib/business-connect/mobile/demo-avatars";
import {
  updateMomentDirect,
  deleteMomentDirect,
} from "@/lib/business-connect/mobile/moment.functions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type MomentManageSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  momentId: string;
  occurredAt?: string;
  title?: string | null;
  placeLabel?: string | null;
  note?: string | null;
  photoUrls?: string[];
  initialPhotos?: string[];
  hasPhotos?: boolean;
  visibility?: "public" | "friends" | "private" | string | null;
  targetPersonId?: string | null;
  targetPersonName?: string | null;
  onChanged: () => void;
};

const FEELINGS_LIST = [
  { id: "sign_contract", label: "Ký kết hợp đồng", emoji: "🤝" },
  { id: "meet_partner", label: "Gặp gỡ đối tác", emoji: "☕" },
  { id: "launch_project", label: "Khởi động dự án mới", emoji: "🚀" },
  { id: "celebrate", label: "Chúc mừng thành tựu", emoji: "🏆" },
  { id: "share_opportunity", label: "Chia sẻ cơ hội kinh doanh", emoji: "💡" },
  { id: "business_trip", label: "Đi công tác xúc tiến", emoji: "✈️" },
  { id: "networking_event", label: "Tham gia sự kiện kết nối", emoji: "🎉" },
  { id: "proud", label: "Tự hào về đội ngũ", emoji: "🌟" },
];

const POPULAR_LOCATIONS = [
  "CLB Doanh Nhân CEO 1983",
  "Trụ sở ViConnect - Hà Nội",
  "Khách sạn Daewoo Hà Nội",
  "Khách sạn JW Marriott",
  "Trung tâm Hội nghị Quốc gia",
  "TP. Hồ Chí Minh",
  "Hà Nội",
  "Đà Nẵng",
];

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MomentManageSheet({
  open,
  onOpenChange,
  momentId,
  occurredAt,
  title,
  placeLabel,
  note,
  photoUrls = [],
  initialPhotos = [],
  visibility: initialVis,
  targetPersonId,
  targetPersonName,
  onChanged,
}: MomentManageSheetProps) {
  const viewerUserId = useViewerUserId();
  const [tagSearchTerm, setTagSearchTerm] = useState("");
  const network = useBusinessConnectNetwork(tagSearchTerm);

  const [content, setContent] = useState(note || "");
  const [visibility, setVisibility] = useState<"public" | "friends" | "private">(
    (initialVis as any) || "friends",
  );
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [location, setLocation] = useState<string>(placeLabel || "");
  const [occurredLocal, setOccurredLocal] = useState<string>("");
  const [taggedPersons, setTaggedPersons] = useState<{ id: string; name: string }[]>([]);
  
  // Existing photo URLs from backend
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  // Newly added photo files with local blob preview
  const [newPhotos, setNewPhotos] = useState<{ file: File; previewUrl: string }[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Sub-view toggles
  const [activeSubView, setActiveSubView] = useState<"none" | "tag" | "feeling" | "location" | "time">("none");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastLoadedKeyRef = useRef<string>("");

  // Initialize data on open or when props change
  useEffect(() => {
    if (!open) {
      lastLoadedKeyRef.current = "";
      return;
    }

    const currentPhotosKey = (photoUrls?.length ? photoUrls : initialPhotos || []).join("|");
    const loadKey = `${momentId || ""}:${occurredAt || ""}:${title || ""}:${placeLabel || ""}:${note || ""}:${initialVis || ""}:${targetPersonId || ""}:${currentPhotosKey}`;
    if (lastLoadedKeyRef.current === loadKey) return;
    lastLoadedKeyRef.current = loadKey;

    setContent(note || "");
    setLocation(placeLabel || "");
    setVisibility((initialVis as any) || "friends");
    
    const d = occurredAt ? new Date(occurredAt) : new Date();
    setOccurredLocal(toLocalInputValue(isNaN(d.getTime()) ? new Date() : d));

    // Resolve feeling matching title
    if (title) {
      const match = FEELINGS_LIST.find(
        (f) => title.includes(f.emoji) || title.toLowerCase().includes(f.label.toLowerCase()),
      );
      setSelectedFeeling(match ? match.id : null);
    } else {
      setSelectedFeeling(null);
    }

    // Existing photos
    const allExisting = (photoUrls && photoUrls.length > 0) ? photoUrls : (initialPhotos || []);
    setExistingPhotos(allExisting);
    setNewPhotos([]);

    // Tagged person if provided
    if (targetPersonId) {
      setTaggedPersons([{ id: targetPersonId, name: targetPersonName || "Đối tác" }]);
    } else {
      setTaggedPersons([]);
    }

    setActiveSubView("none");
  }, [open, momentId, occurredAt, title, placeLabel, note, initialVis, targetPersonId, targetPersonName]);

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      newPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, [newPhotos]);

  if (!open) return null;

  const totalPhotosCount = existingPhotos.length + newPhotos.length;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(100, textareaRef.current.scrollHeight)}px`;
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((f) => f.type.startsWith("image/"));
    if (validFiles.length + totalPhotosCount > 6) {
      toast.warning("Bạn có thể tải lên tối đa 6 ảnh cho mỗi khoảnh khắc.");
    }

    const availableSlots = Math.max(0, 6 - totalPhotosCount);
    const filesToAdd = validFiles.slice(0, availableSlots);

    const created = filesToAdd.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setNewPhotos((prev) => [...prev, ...created]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeExistingPhoto = (index: number) => {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewPhoto = (index: number) => {
    setNewPhotos((prev) => {
      const target = prev[index];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const toggleTagPerson = (person: { personId: string; displayName?: string | null }) => {
    const id = person.personId;
    const name = person.displayName || "Đối tác";
    setTaggedPersons((prev) => {
      if (prev.some((p) => p.id === id)) {
        return prev.filter((p) => p.id !== id);
      }
      return [...prev, { id, name }];
    });
  };

  const handleSave = async () => {
    const cleanContent = content.trim();
    if (!cleanContent && totalPhotosCount === 0) {
      toast.warning("Vui lòng nhập nội dung hoặc đính kèm hình ảnh.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Upload new photos
      const uploadedNewUrls: string[] = [];
      for (const p of newPhotos) {
        try {
          const res = await uploadFileToNest(p.file, "relationship-moments");
          if (res) uploadedNewUrls.push(res);
        } catch {
          const reader = new FileReader();
          const b64 = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(p.file);
          });
          uploadedNewUrls.push(b64);
        }
      }

      const finalPhotoUrls = [...existingPhotos, ...uploadedNewUrls];
      const feelingObj = FEELINGS_LIST.find((f) => f.id === selectedFeeling);
      const eventName = feelingObj ? `${feelingObj.emoji} ${feelingObj.label}` : title || undefined;
      const primaryPersonId = taggedPersons[0]?.id || targetPersonId || undefined;
      const isoOccurredAt = occurredLocal ? new Date(occurredLocal).toISOString() : new Date().toISOString();

      // 2. Call update endpoint
      const updateRes = await updateMomentDirect(momentId, {
        momentId,
        occurredAt: isoOccurredAt,
        eventName: eventName || null,
        placeLabel: location.trim() || null,
        note: cleanContent || null,
        visibility,
        targetPersonId: primaryPersonId,
        photoUrls: finalPhotoUrls,
        taggedUserIds: taggedPersons.map((p) => p.id.replace(/^u:/, "")),
      });

      if (updateRes.ok) {
        toast.success("Đã cập nhật khoảnh khắc thành công!");
        onOpenChange(false);
        onChanged();
      } else {
        toast.error("Không thể cập nhật khoảnh khắc. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Save moment error:", err);
      toast.error("Đã xảy ra lỗi khi lưu khoảnh khắc.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await deleteMomentDirect(momentId);
      if (res.ok) {
        toast.success("Đã xoá khoảnh khắc thành công.");
        setDeleteConfirmOpen(false);
        onOpenChange(false);
        onChanged();
      } else {
        toast.error("Không thể xoá khoảnh khắc.");
      }
    } catch {
      toast.error("Lỗi kết nối khi xoá khoảnh khắc.");
    } finally {
      setDeleting(false);
    }
  };

  const activeFeelingObj = FEELINGS_LIST.find((f) => f.id === selectedFeeling);

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md transition-all animate-in fade-in duration-200">
        <div
          role="dialog"
          aria-modal="true"
          className="bc-app relative flex flex-col w-full max-w-[540px] max-h-[92vh] rounded-t-3xl sm:rounded-3xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] text-[var(--bc-mobile-text)] shadow-2xl overflow-hidden box-border"
        >
          {/* Header */}
          <div className="relative flex items-center justify-between px-5 py-4 border-b border-[var(--bc-mobile-border)]">
            {activeSubView !== "none" ? (
              <button
                type="button"
                onClick={() => setActiveSubView("none")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--bc-mobile-accent-strong,#8C653B)] dark:text-[#F6E1C3] hover:underline cursor-pointer"
              >
                ← Quay lại
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--bc-mobile-accent)]" />
                <h2 className="text-base font-bold text-[var(--bc-mobile-text)] tracking-wide">
                  Chỉnh sửa khoảnh khắc
                </h2>
              </div>
            )}

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-full text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)] hover:bg-[var(--bc-mobile-surface-2)] transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Subview: Gắn thẻ đối tác */}
          {activeSubView === "tag" ? (
            <div className="flex-1 flex flex-col p-4 overflow-hidden min-h-[380px]">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--bc-mobile-muted)]" />
                <input
                  type="text"
                  placeholder="Tìm kiếm đối tác theo tên, công ty..."
                  value={tagSearchTerm}
                  onChange={(e) => setTagSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] text-[var(--bc-mobile-text)] placeholder:text-[var(--bc-mobile-muted)] focus:outline-none focus:border-[var(--bc-mobile-accent)]"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {network.people.length === 0 ? (
                  <div className="py-8 text-center text-sm text-[var(--bc-mobile-muted)]">
                    Chưa tìm thấy đối tác nào phù hợp
                  </div>
                ) : (
                  network.people.map((person) => {
                    const isSelected = taggedPersons.some((p) => p.id === person.personId);
                    return (
                      <button
                        key={person.personId}
                        type="button"
                        onClick={() => toggleTagPerson(person)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer ${
                          isSelected
                            ? "bg-[var(--bc-mobile-accent)]/15 border-[var(--bc-mobile-accent)] text-[var(--bc-mobile-text)]"
                            : "bg-[var(--bc-mobile-surface-2)] border-[var(--bc-mobile-border)] text-[var(--bc-mobile-text)] hover:border-[var(--bc-mobile-accent)]/50"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={avatarOrDemo(person.avatarUrl, person.personId)}
                            alt={person.displayName || "Avatar"}
                            className="h-10 w-10 rounded-full object-cover border border-[var(--bc-mobile-border)]"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate text-[var(--bc-mobile-text)]">
                              {person.displayName || "Đối tác"}
                            </p>
                            <p className="text-xs text-[var(--bc-mobile-muted)] truncate">
                              {person.headline || person.companyName || "Thành viên mạng lưới"}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`h-5 w-5 rounded-full flex items-center justify-center border ${
                            isSelected
                              ? "bg-[var(--bc-mobile-accent)] border-[var(--bc-mobile-accent)] text-slate-950"
                              : "border-[var(--bc-mobile-border)]"
                          }`}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="pt-3 border-t border-[var(--bc-mobile-border)] flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveSubView("none")}
                  className="px-5 py-2 rounded-xl bg-[var(--bc-mobile-accent)] text-slate-950 font-semibold text-sm hover:brightness-110 cursor-pointer shadow-sm"
                >
                  Xong ({taggedPersons.length})
                </button>
              </div>
            </div>
          ) : activeSubView === "feeling" ? (
            /* Subview: Chọn cảm xúc / Hoạt động */
            <div className="flex-1 p-4 overflow-y-auto min-h-[380px]">
              <p className="text-xs font-medium text-[var(--bc-mobile-muted)] mb-3 uppercase tracking-wider">
                Bạn và đối tác đang thực hiện hoạt động gì?
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {FEELINGS_LIST.map((f) => {
                  const isSelected = selectedFeeling === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setSelectedFeeling(isSelected ? null : f.id);
                        setActiveSubView("none");
                      }}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[var(--bc-mobile-accent)]/20 border-[var(--bc-mobile-accent)] text-[var(--bc-mobile-accent-strong,#8C653B)] dark:text-[#F6E1C3] font-bold"
                          : "bg-[var(--bc-mobile-surface-2)] border-[var(--bc-mobile-border)] text-[var(--bc-mobile-text)] hover:border-[var(--bc-mobile-accent)]/50"
                      }`}
                    >
                      <span className="text-xl">{f.emoji}</span>
                      <span className="text-xs font-semibold">{f.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : activeSubView === "location" ? (
            /* Subview: Check-in vị trí */
            <div className="flex-1 p-4 overflow-y-auto min-h-[380px] space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--bc-mobile-text)] mb-1.5">
                  Nhập địa điểm / Nhà hàng / Văn phòng
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--bc-mobile-accent)]" />
                  <input
                    type="text"
                    placeholder="VD: Khách sạn JW Marriott, Hà Nội..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] text-[var(--bc-mobile-text)] placeholder:text-[var(--bc-mobile-muted)] focus:outline-none focus:border-[var(--bc-mobile-accent)]"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-[var(--bc-mobile-muted)] mb-2">Gợi ý địa điểm phổ biến:</p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => {
                        setLocation(loc);
                        setActiveSubView("none");
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                        location === loc
                          ? "bg-[var(--bc-mobile-accent)] border-[var(--bc-mobile-accent)] text-slate-950 font-semibold shadow-sm"
                          : "bg-[var(--bc-mobile-surface-2)] border-[var(--bc-mobile-border)] text-[var(--bc-mobile-text)] hover:border-[var(--bc-mobile-accent)]"
                      }`}
                    >
                      📍 {loc}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveSubView("none")}
                  className="px-5 py-2 rounded-xl bg-[var(--bc-mobile-accent)] text-slate-950 font-semibold text-sm hover:brightness-110 cursor-pointer shadow-sm"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          ) : activeSubView === "time" ? (
            /* Subview: Thời điểm diễn ra */
            <div className="flex-1 p-4 overflow-y-auto min-h-[300px] space-y-4">
              <label className="block text-xs font-semibold text-[var(--bc-mobile-text)] mb-1.5">
                Ngày & giờ diễn ra khoảnh khắc:
              </label>
              <input
                type="datetime-local"
                value={occurredLocal}
                max={toLocalInputValue(new Date())}
                onChange={(e) => setOccurredLocal(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] text-[var(--bc-mobile-text)] focus:outline-none focus:border-[var(--bc-mobile-accent)]"
              />
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveSubView("none")}
                  className="px-5 py-2 rounded-xl bg-[var(--bc-mobile-accent)] text-slate-950 font-semibold text-sm hover:brightness-110 cursor-pointer shadow-sm"
                >
                  Xong
                </button>
              </div>
            </div>
          ) : (
            /* Main Form View */
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* User Bar & Scope */}
              <div className="flex items-center gap-3">
                <img
                  src={avatarOrDemo(null, viewerUserId || "me")}
                  alt="Avatar"
                  className="h-11 w-11 rounded-full object-cover border-2 border-[var(--bc-mobile-accent)]"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[var(--bc-mobile-text)]">Bạn</span>
                    {activeFeelingObj && (
                      <span className="inline-flex items-center gap-1 text-xs text-[var(--bc-mobile-accent-strong,#8C653B)] dark:text-[#F0D5A8] bg-[var(--bc-mobile-accent)]/15 px-2 py-0.5 rounded-full border border-[var(--bc-mobile-accent)]/30">
                        {activeFeelingObj.emoji} đang {activeFeelingObj.label.toLowerCase()}
                      </span>
                    )}
                    {location && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-200 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        📍 tại {location}
                      </span>
                    )}
                  </div>

                  {/* Privacy Picker Dropdown */}
                  <div className="relative inline-flex items-center gap-1 mt-1">
                    <div className="relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] text-[11px] font-semibold text-[var(--bc-mobile-text)] shadow-xs">
                      {visibility === "public" ? (
                        <>
                          <Globe className="h-3.5 w-3.5 text-amber-500" />
                          <span>Công khai</span>
                        </>
                      ) : visibility === "friends" ? (
                        <>
                          <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Mạng lưới</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-3.5 w-3.5 text-amber-500" />
                          <span>Chỉ mình tôi (Private)</span>
                        </>
                      )}
                      <span className="ml-1 text-[9px] text-[var(--bc-mobile-muted)]">▼</span>

                      {/* Native Select Overlay */}
                      <select
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value as any)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                        aria-label="Chọn quyền riêng tư"
                      >
                        <option value="friends" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          👥 Mạng lưới kết nối (Mặc định)
                        </option>
                        <option value="public" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          🌍 Công khai toàn hệ sinh thái
                        </option>
                        <option value="private" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          🔒 Chỉ mình tôi (Riêng tư - Private)
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tagged Persons List */}
              {taggedPersons.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 bg-[var(--bc-mobile-accent)]/10 p-2.5 rounded-xl border border-[var(--bc-mobile-accent)]/20">
                  <span className="text-xs font-semibold text-[var(--bc-mobile-accent-strong,#8C653B)] dark:text-[#F6E1C3]">
                    Cùng với:
                  </span>
                  {taggedPersons.map((tp) => (
                    <span
                      key={tp.id}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--bc-mobile-accent)]/20 text-[var(--bc-mobile-text)] text-xs font-medium border border-[var(--bc-mobile-accent)]/40"
                    >
                      @{tp.name}
                      <button
                        type="button"
                        onClick={() => toggleTagPerson({ personId: tp.id })}
                        className="hover:text-red-500 ml-0.5 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setActiveSubView("tag")}
                    className="text-xs font-semibold text-[var(--bc-mobile-accent-strong,#8C653B)] dark:text-[#F6E1C3] hover:underline ml-1 cursor-pointer"
                  >
                    + Thêm
                  </button>
                </div>
              )}

              {/* Text Input */}
              <div className="relative rounded-2xl bg-[var(--bc-mobile-surface-2)]/60 border border-[var(--bc-mobile-border)] p-3">
                <textarea
                  ref={textareaRef}
                  rows={4}
                  placeholder="Cập nhật nội dung khoảnh khắc..."
                  value={content}
                  onChange={handleContentChange}
                  className="w-full bg-transparent text-sm sm:text-base text-[var(--bc-mobile-text)] placeholder:text-[var(--bc-mobile-muted)] focus:outline-none resize-none leading-relaxed border-none p-0"
                />
              </div>

              {/* Photo Preview Grid */}
              {totalPhotosCount > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[var(--bc-mobile-muted)]">
                    <span>Hình ảnh đính kèm ({totalPhotosCount}/6):</span>
                    {totalPhotosCount < 6 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[var(--bc-mobile-accent-strong,#8C653B)] dark:text-[#D8B282] font-semibold hover:underline cursor-pointer"
                      >
                        + Thêm ảnh
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Existing Photos */}
                    {existingPhotos.map((url, i) => (
                      <div
                        key={`exist-${i}`}
                        className="relative aspect-square rounded-xl overflow-hidden border border-[var(--bc-mobile-border)] group"
                      >
                        <img src={url} alt={`Ảnh ${i + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExistingPhoto(i)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-red-600 transition-colors cursor-pointer"
                          aria-label="Xóa ảnh"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    {/* New Photos */}
                    {newPhotos.map((p, i) => (
                      <div
                        key={`new-${i}`}
                        className="relative aspect-square rounded-xl overflow-hidden border border-emerald-500/50 group"
                      >
                        <img src={p.previewUrl} alt={`Ảnh mới ${i + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeNewPhoto(i)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-red-600 transition-colors cursor-pointer"
                          aria-label="Xóa ảnh"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoSelect}
              />

              {/* Quick Actions Toolbar */}
              <div className="p-3 rounded-2xl bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--bc-mobile-muted)]">Tùy chỉnh:</span>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-xl text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                    title="Thêm ảnh"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSubView("tag")}
                    className="p-2 rounded-xl text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
                    title="Gắn thẻ đối tác"
                  >
                    <Users className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSubView("feeling")}
                    className="p-2 rounded-xl text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
                    title="Cảm xúc / Hoạt động"
                  >
                    <Smile className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSubView("location")}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Check-in vị trí"
                  >
                    <MapPin className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSubView("time")}
                    className="p-2 rounded-xl text-[var(--bc-mobile-accent)] hover:bg-[var(--bc-mobile-accent)]/10 transition-colors cursor-pointer"
                    title="Thời gian diễn ra"
                  >
                    <Clock className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Footer Actions: Save & Delete */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-red-500/30 text-red-500 bg-red-500/10 hover:bg-red-500/20 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  Xoá bài
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    disabled={submitting}
                    className="px-4 py-2.5 rounded-xl border border-[var(--bc-mobile-border)] text-[var(--bc-mobile-text)] bg-[var(--bc-mobile-surface-2)] text-xs font-semibold hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    Hủy
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-[linear-gradient(135deg,#F0D5A8_0%,#D8B282_50%,#C49B6A_100%)] hover:brightness-110 active:scale-95 shadow-md disabled:opacity-60 transition-all cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <span>Lưu thay đổi</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="border border-[#2a364a] bg-[#0c131f]/95 backdrop-blur-xl text-[#f1f5f9]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#f87171]">Xác nhận xoá khoảnh khắc</AlertDialogTitle>
            <AlertDialogDescription className="text-[#94a3b8]">
              Bạn có chắc chắn muốn xoá khoảnh khắc này? Hành động này sẽ xoá vĩnh viễn hình ảnh, bình luận và lượt thích đi kèm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#2a364a] text-[#f1f5f9] hover:bg-[#1a2332]">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? "Đang xoá..." : "Xoá vĩnh viễn"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
