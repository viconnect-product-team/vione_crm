// BC-Mobile — Modal Tạo & Đăng khoảnh khắc (Facebook-grade Social Moment Composer).
// Đầy đủ tính năng: Soạn nội dung, Tải nhiều ảnh, Gắn thẻ đối tác (@tag), Chọn cảm xúc/hoạt động kinh doanh, Check-in địa điểm, Chọn quyền riêng tư.

import { useState, useRef, useEffect } from "react";
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
  Plus,
  Check,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";
import { useBusinessConnectNetwork } from "@/hooks/use-business-connect-network";
import { uploadFileToNest, fetchNestApi } from "@/lib/api-client";
import { avatarOrDemo } from "@/lib/business-connect/mobile/demo-avatars";
import {
  bcMobileMomentPrepareFn,
  bcMobileMomentFinalizeFn,
} from "@/lib/business-connect/mobile/moment.functions";
import { safeRandomUUID } from "@/lib/utils";

export type PostMomentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFeeling?: string;
  initialTaggedPersonId?: string;
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

export function PostMomentModal({
  open,
  onOpenChange,
  initialFeeling,
  initialTaggedPersonId,
}: PostMomentModalProps) {
  const queryClient = useQueryClient();
  const viewerUserId = useViewerUserId();
  const [tagSearchTerm, setTagSearchTerm] = useState("");
  const network = useBusinessConnectNetwork(tagSearchTerm);

  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"public" | "friends" | "private">("friends");
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(initialFeeling || null);
  const [location, setLocation] = useState<string>("");
  const [taggedPersons, setTaggedPersons] = useState<{ id: string; name: string }[]>([]);
  const [photos, setPhotos] = useState<{ file: File; previewUrl: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Sub-view toggles
  const [activeSubView, setActiveSubView] = useState<"none" | "tag" | "feeling" | "location">("none");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize initial tagged person if provided
  useEffect(() => {
    if (initialTaggedPersonId && network.people.length > 0) {
      const match = network.people.find((p) => p.personId === initialTaggedPersonId);
      if (match && !taggedPersons.some((tp) => tp.id === match.personId)) {
        setTaggedPersons([{ id: match.personId, name: match.displayName || "Đối tác" }]);
      }
    }
  }, [initialTaggedPersonId, network.people]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, [photos]);

  // Auto-resize textarea
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
    if (validFiles.length + photos.length > 6) {
      toast.warning("Bạn có thể tải lên tối đa 6 ảnh cho mỗi khoảnh khắc.");
    }

    const availableSlots = Math.max(0, 6 - photos.length);
    const filesToAdd = validFiles.slice(0, availableSlots);

    const newPhotos = filesToAdd.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setPhotos((prev) => [...prev, ...newPhotos]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
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

  const handlePost = async () => {
    const cleanContent = content.trim();
    if (!cleanContent && photos.length === 0) {
      toast.warning("Vui lòng nhập nội dung hoặc đính kèm ảnh.");
      return;
    }

    setSubmitting(true);
    const clientToken = safeRandomUUID();

    try {
      // 1. Upload photos if any
      const uploadedUrls: string[] = [];
      for (const p of photos) {
        try {
          const res = await uploadFileToNest(p.file, "relationship-moments");
          if (res) {
            uploadedUrls.push(res);
          }
        } catch {
          // Fallback base64
          const reader = new FileReader();
          const b64 = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(p.file);
          });
          uploadedUrls.push(b64);
        }
      }

      // Primary person target (or self if broadcast)
      const primaryPersonId = taggedPersons[0]?.id || `u:${viewerUserId}`;
      const feelingObj = FEELINGS_LIST.find((f) => f.id === selectedFeeling);
      const eventName = feelingObj ? `${feelingObj.emoji} ${feelingObj.label}` : undefined;

      // 2. Prepare & Finalize Moment via Nest API
      const prepRes = await bcMobileMomentPrepareFn({
        data: {
          clientToken,
          personId: primaryPersonId,
          occurredAt: new Date().toISOString(),
          eventName,
          placeLabel: location.trim() || undefined,
          note: cleanContent,
          photoCount: uploadedUrls.length,
          visibility,
        },
      });

      if (prepRes.ok) {
        await bcMobileMomentFinalizeFn({
          data: {
            clientToken,
            momentId: prepRes.momentId,
            verifiedSlotOrders: (prepRes.photos || []).map((s) => s.sortOrder),
          },
        });
      }

      // 3. Notify tagged connections via broadcast or API
      if (taggedPersons.length > 0) {
        try {
          await fetchNestApi("/connect-app/moments/notify-tags", {
            method: "POST",
            body: JSON.stringify({
              momentId: prepRes.ok ? prepRes.momentId : clientToken,
              taggedUserIds: taggedPersons.map((p) => p.id.replace(/^u:/, "")),
              content: cleanContent.slice(0, 100),
            }),
          }).catch(() => null);
        } catch {
          // ignore
        }
      }

      toast.success("Đã đăng khoảnh khắc thành công!", {
        description: "Bài viết đã được chia sẻ lên bảng tin mạng lưới.",
      });

      // Refetch network and feeds
      queryClient.invalidateQueries({ queryKey: ["bc-mobile"] });
      queryClient.invalidateQueries({ queryKey: ["network-feed"] });
      queryClient.invalidateQueries({ queryKey: ["bc-home"] });

      // Reset and close
      setContent("");
      setPhotos([]);
      setTaggedPersons([]);
      setSelectedFeeling(null);
      setLocation("");
      onOpenChange(false);
    } catch (err) {
      console.error("[PostMomentModal] Error posting moment:", err);
      toast.error("Không thể đăng khoảnh khắc. Vui lòng thử lại sau.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const currentFeeling = FEELINGS_LIST.find((f) => f.id === selectedFeeling);
  const filteredConnections = network.people.filter((p) =>
    (p.displayName || "").toLowerCase().includes(tagSearchTerm.toLowerCase()) ||
    (p.companyName || "").toLowerCase().includes(tagSearchTerm.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bc-app w-full max-w-[520px] max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] text-[var(--bc-mobile-text)] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--bc-mobile-border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-slate-950 font-bold text-xs">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold text-[var(--bc-mobile-text)]">Ghi nhớ khoảnh khắc</h2>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="grid h-8 w-8 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 [scrollbar-width:thin]">
          {/* Author Profile + Settings Bar */}
          <div className="flex items-start gap-3">
            <img
              src={avatarOrDemo(null, viewerUserId || "me")}
              alt=""
              className="h-11 w-11 rounded-full object-cover border border-[var(--bc-mobile-accent)]/50 shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-sm text-[var(--bc-mobile-text)]">Bạn</span>
                {currentFeeling && (
                  <span className="text-xs text-[var(--bc-mobile-accent-strong,#8C653B)] dark:text-[#E8C986] flex items-center gap-1">
                    đang {currentFeeling.emoji} <strong>{currentFeeling.label}</strong>
                    <button
                      type="button"
                      onClick={() => setSelectedFeeling(null)}
                      className="text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)] ml-0.5 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                )}
                {taggedPersons.length > 0 && (
                  <span className="text-xs text-[var(--bc-mobile-muted)]">
                    cùng với{" "}
                    <strong className="text-[var(--bc-mobile-accent-strong,#8C653B)] dark:text-[#E8C986]">
                      {taggedPersons[0].name}
                      {taggedPersons.length > 1 ? ` và ${taggedPersons.length - 1} người khác` : ""}
                    </strong>
                    <button
                      type="button"
                      onClick={() => setTaggedPersons([])}
                      className="text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)] ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                )}
                {location && (
                  <span className="text-xs text-[var(--bc-mobile-muted)] flex items-center gap-0.5">
                    tại <strong className="text-[var(--bc-mobile-accent-strong,#8C653B)] dark:text-[#E8C986]">{location}</strong>
                    <button
                      type="button"
                      onClick={() => setLocation("")}
                      className="text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)] ml-0.5 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>

              {/* Privacy Selector — 3 chế độ: Công khai, Bạn bè, Chỉ mình tôi */}
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setVisibility("public")}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                    visibility === "public"
                      ? "bg-[#D8B282]/20 border border-[#D8B282] text-[#F6E1C3] shadow-xs"
                      : "bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)]"
                  }`}
                >
                  <Globe className="h-3 w-3 text-amber-400" />
                  <span>Công khai</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility("friends")}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                    visibility === "friends"
                      ? "bg-[#D8B282]/20 border border-[#D8B282] text-[#F6E1C3] shadow-xs"
                      : "bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)]"
                  }`}
                >
                  <Users className="h-3 w-3 text-amber-400" />
                  <span>Bạn bè</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility("private")}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                    visibility === "private"
                      ? "bg-[#D8B282]/20 border border-[#D8B282] text-[#F6E1C3] shadow-xs"
                      : "bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)]"
                  }`}
                >
                  <Lock className="h-3 w-3 text-rose-400" />
                  <span>Chỉ mình tôi</span>
                </button>
              </div>
            </div>
          </div>

          {/* Textarea */}
          <div className="relative rounded-2xl bg-[var(--bc-mobile-surface-2)]/60 border border-[var(--bc-mobile-border)] p-3">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              placeholder="Bạn đang nghĩ gì? Chia sẻ khoảnh khắc, cơ hội hợp tác kinh doanh hôm nay..."
              disabled={submitting}
              className="w-full min-h-[110px] bg-transparent text-sm sm:text-base text-[var(--bc-mobile-text)] placeholder:text-[var(--bc-mobile-muted)] outline-none resize-none leading-relaxed border-none p-0"
            />
          </div>

          {/* Photos Preview Grid */}
          {photos.length > 0 && (
            <div className={`grid gap-2 rounded-2xl overflow-hidden ${
              photos.length === 1
                ? "grid-cols-1"
                : photos.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-3"
            }`}>
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className="relative group rounded-xl overflow-hidden bg-black/40 border border-white/10 aspect-square"
                >
                  <img
                    src={photo.previewUrl}
                    alt=""
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1.5 right-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/75 text-white hover:bg-black transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {photos.length < 6 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center gap-1 text-white/60 hover:text-white hover:border-[#D8B282] hover:bg-white/10 transition-all aspect-square cursor-pointer"
                >
                  <Plus className="h-5 w-5" />
                  <span className="text-[11px] font-medium">Thêm ảnh</span>
                </button>
              )}
            </div>
          )}

          {/* Sub-views drawers inside modal */}
          {activeSubView === "feeling" && (
            <div className="rounded-2xl border border-white/15 bg-white/5 p-3 space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-white/10">
                <span className="text-xs font-bold text-[#E8C986] uppercase tracking-wider">
                  Chọn cảm xúc / Hoạt động
                </span>
                <button
                  type="button"
                  onClick={() => setActiveSubView("none")}
                  className="text-xs text-white/50 hover:text-white cursor-pointer"
                >
                  Đóng
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pt-1">
                {FEELINGS_LIST.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setSelectedFeeling(f.id);
                      setActiveSubView("none");
                    }}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                      selectedFeeling === f.id
                        ? "bg-[#D8B282]/20 text-[#E8C986] font-bold border border-[#D8B282]/50"
                        : "hover:bg-white/10 text-white/80"
                    }`}
                  >
                    <span className="text-base">{f.emoji}</span>
                    <span className="truncate">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSubView === "tag" && (
            <div className="rounded-2xl border border-white/15 bg-white/5 p-3 space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-white/10">
                <span className="text-xs font-bold text-[#E8C986] uppercase tracking-wider">
                  Gắn thẻ đối tác ({taggedPersons.length})
                </span>
                <button
                  type="button"
                  onClick={() => setActiveSubView("none")}
                  className="text-xs text-white/50 hover:text-white cursor-pointer"
                >
                  Xong
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-white/40" />
                <input
                  type="text"
                  value={tagSearchTerm}
                  onChange={(e) => setTagSearchTerm(e.target.value)}
                  placeholder="Tìm theo tên đối tác, công ty..."
                  className="w-full rounded-xl bg-black/40 border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#D8B282]"
                />
              </div>
              <div className="max-h-44 overflow-y-auto space-y-1 pt-1">
                {filteredConnections.length === 0 ? (
                  <div className="text-center py-3 text-xs text-white/40">Không tìm thấy đối tác</div>
                ) : (
                  filteredConnections.map((person) => {
                    const isSelected = taggedPersons.some((tp) => tp.id === person.personId);
                    return (
                      <button
                        key={person.personId}
                        type="button"
                        onClick={() => toggleTagPerson(person)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer ${
                          isSelected ? "bg-[#D8B282]/20 border border-[#D8B282]/40" : "hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={avatarOrDemo(person.avatarUrl, person.personId)}
                            alt=""
                            className="h-7 w-7 rounded-full object-cover"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{person.displayName}</p>
                            <p className="text-[10px] text-white/50 truncate">
                              {person.headline || person.companyName || "Hội viên ViOne"}
                            </p>
                          </div>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-[#D8B282] shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeSubView === "location" && (
            <div className="rounded-2xl border border-white/15 bg-white/5 p-3 space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-white/10">
                <span className="text-xs font-bold text-[#E8C986] uppercase tracking-wider">
                  Check-in địa điểm
                </span>
                <button
                  type="button"
                  onClick={() => setActiveSubView("none")}
                  className="text-xs text-white/50 hover:text-white cursor-pointer"
                >
                  Xong
                </button>
              </div>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#D8B282]" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Nhập địa điểm hoặc sự kiện..."
                  className="w-full rounded-xl bg-black/40 border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#D8B282]"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {POPULAR_LOCATIONS.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => {
                      setLocation(loc);
                      setActiveSubView("none");
                    }}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer ${
                      location === loc
                        ? "bg-[#D8B282] text-slate-950 border-[#D8B282] font-bold"
                        : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                    }`}
                  >
                    📍 {loc}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Hidden multi-file picker */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelect}
          />
        </div>

        {/* Modal Footer Toolbar & Post Action */}
        <div className="border-t border-white/10 px-5 py-3.5 bg-black/20 space-y-3">
          {/* Quick Tools Bar (Facebook style) */}
          <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-3 py-2">
            <span className="text-xs font-semibold text-white/70">Thêm vào khoảnh khắc:</span>
            <div className="flex items-center gap-1 text-white/80">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Đính kèm ảnh"
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                <ImageIcon className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveSubView(activeSubView === "tag" ? "none" : "tag")}
                title="Gắn thẻ bạn bè / Đối tác"
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                <Users className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveSubView(activeSubView === "feeling" ? "none" : "feeling")}
                title="Cảm xúc / Hoạt động"
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                <Smile className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveSubView(activeSubView === "location" ? "none" : "location")}
                title="Check-in địa điểm"
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
              >
                <MapPin className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Primary Submit Button */}
          <button
            type="button"
            onClick={handlePost}
            disabled={submitting || (!content.trim() && photos.length === 0)}
            className="w-full py-3 rounded-full font-bold text-sm bg-gradient-to-r from-[#F7D896] via-[#E2B755] to-[#C49338] text-slate-950 shadow-[0_4px_20px_rgba(216,178,130,0.4)] hover:opacity-95 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang lưu khoảnh khắc...</span>
              </>
            ) : (
              <>
                <span>Lưu ghi nhớ khoảnh khắc</span>
                <Sparkles className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
