// BC-Mobile-2E — Meeting Moment composer.
//
// Truthful capture flow: prepare (server validates target authorization,
// bounds, and field rules; returns the moment id + deterministic storage
// slots) → client-side JPEG/EXIF-strip → bounded-concurrency upload to the
// PRIVATE bucket → finalize (server verifies per-slot uploads). Idempotent
// end-to-end via a clientToken minted once per composer mount; every failure
// stays in place with retry — nothing is half-saved silently. Success
// navigates back to the person's detail with a saved banner.

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bookmark as BookmarkIcon,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Camera,
  ChevronRight,
  Crop as CropIcon,
  Globe,
  Lock,
  ImagePlus,
  MapPin,
  NotebookPen,
  RefreshCw,
  RotateCcw,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { useLang, useT, type TKey } from "@/lib/i18n";
import { safeRandomUUID } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  clearMomentDraft,
  isDraftEmpty,
  readMomentDraft,
  writeMomentDraft,
} from "@/lib/business-connect/moment-draft";
import { useBusinessConnectPerson } from "@/hooks/use-business-connect-person";
import {
  MOMENT_MAX_EVENT_NAME_LEN,
  MOMENT_MAX_NOTE_LEN,
  MOMENT_MAX_PHOTOS,
  MOMENT_MAX_PLACE_LABEL_LEN,
  MOMENT_OCCURRED_FUTURE_SKEW_MS,
} from "@/lib/business-connect/mobile/moment.types";
import {
  bcMobileMomentFinalizeFn,
  bcMobileMomentPrepareFn,
} from "@/lib/business-connect/mobile/moment.functions";
import { fetchNestApi, uploadFileToNest } from "@/lib/api-client";
import {
  MOMENT_IMAGE_ACCEPT,
  processMomentImage,
} from "@/lib/business-connect/mobile/moment-image";
import { takeStagedMomentPhotos } from "@/lib/business-connect/mobile/moment-photo-handoff";
import { requestCameraPermission } from "@/lib/business-connect/mobile/camera-permission";
import { MomentVoiceNote } from "@/components/business-connect/mobile/MomentVoiceNote";
import {
  MomentReminderPicker,
  defaultReminderAt,
  type MomentReminderChoice,
} from "@/components/business-connect/mobile/MomentReminderPicker";
import { bcMobileMomentReminderCreateFn } from "@/lib/business-connect/mobile/moment-reminder.functions";

import { MobilePage } from "./MobilePage";
import { MomentPhotoCropper } from "./MomentPhotoCropper";
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

const MOMENT_MEDIA_BUCKET = "relationship-moments";

type PhotoDraft = {
  id: string;
  blob: Blob | null;
  previewUrl: string | null;
  errorKey: TKey | null;
};

const ERROR_KEY_BY_CODE: Record<string, TKey> = {
  invalid_occurred_at: "bc.mobile.moment.error.occurredAt",
  relationship_not_authorized: "bc.mobile.moment.error.relationship",
  not_found: "bc.mobile.moment.error.relationship",
};

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next;
        next += 1;
        await fn(items[i]!, i);
      }
    }),
  );
}

export function MomentComposer({ personId }: { personId: string }) {
  const t = useT();
  const { lang } = useLang();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const person = useBusinessConnectPerson(personId);

  const clientTokenRef = useRef<string>(safeRandomUUID());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [occurredLocal, setOccurredLocal] = useState(() => toLocalInputValue(new Date()));
  const [eventName, setEventName] = useState("");
  const [placeLabel, setPlaceLabel] = useState("");
  const [note, setNote] = useState("");
  /** Nội dung ghi chú ngay trước khi AI điền — dùng cho nút Hoàn tác. */
  const [noteBeforeVoice, setNoteBeforeVoice] = useState<string | null>(null);
  /** Nhắc nhở tuỳ chọn — chỉ được tạo SAU khi khoảnh khắc lưu thành công. */
  const [reminder, setReminder] = useState<MomentReminderChoice>({
    enabled: false,
    atLocal: defaultReminderAt(7),
    label: "",
  });
  const [visibility, setVisibility] = useState<"friends" | "public" | "private">("friends");
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  // Tiến trình xử lý ảnh phía trình duyệt (nén/xoay/strip EXIF) và tải lên máy chủ.
  const [processing, setProcessing] = useState<{ done: number; total: number } | null>(null);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorKey, setErrorKey] = useState<TKey | null>(null);
  // Nháp tự động: khôi phục sau khi hydrate, lưu lại khi nội dung thay đổi.
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  /** true trong lúc thay đổi chưa kịp ghi xuống nháp (debounce). */
  const [draftSaving, setDraftSaving] = useState(false);
  const draftLoadedRef = useRef(false);
  /** true sau khi đã lưu thật lên máy chủ → không ghi lại nháp khi rời màn. */
  const savedRef = useRef(false);
  useEffect(() => {
    const d = readMomentDraft(personId);
    draftLoadedRef.current = true;
    if (!d) return;
    if (d.occurredLocal) setOccurredLocal(d.occurredLocal);
    setEventName(d.eventName);
    setPlaceLabel(d.placeLabel);
    setNote(d.note);
    setReminder({
      enabled: d.reminderEnabled,
      atLocal: d.reminderAtLocal || defaultReminderAt(7),
      label: d.reminderLabel,
    });
    setDraftRestored(true);
    setDraftSavedAt(d.updatedAt);
  }, [personId]);

  const currentDraft = useMemo(
    () => ({
      occurredLocal,
      eventName,
      placeLabel,
      note,
      reminderEnabled: reminder.enabled,
      reminderAtLocal: reminder.atLocal,
      reminderLabel: reminder.label,
    }),
    [occurredLocal, eventName, placeLabel, note, reminder],
  );
  const draftRef = useRef(currentDraft);
  draftRef.current = currentDraft;

  useEffect(() => {
    if (!draftLoadedRef.current) return;
    if (!isDraftEmpty(currentDraft)) setDraftSaving(true);
    const id = window.setTimeout(() => {
      writeMomentDraft(personId, currentDraft);
      setDraftSavedAt(isDraftEmpty(currentDraft) ? null : Date.now());
      // Nội dung đã đổi so với lúc khôi phục → banner nói "đã lưu", không còn "đã khôi phục".
      setDraftRestored(false);
      setDraftSaving(false);
    }, 600);
    return () => window.clearTimeout(id);
  }, [personId, currentDraft]);

  // Rời màn hình (đóng tab / chuyển trang) vẫn giữ nguyên nội dung đang gõ.
  useEffect(() => {
    return () => {
      if (!draftLoadedRef.current || savedRef.current) return;
      writeMomentDraft(personId, draftRef.current);
    };
  }, [personId]);

  function discardDraft() {
    clearMomentDraft(personId);
    setEventName("");
    setPlaceLabel("");
    setNote("");
    setOccurredLocal(toLocalInputValue(new Date()));
    setReminder({ enabled: false, atLocal: defaultReminderAt(7), label: "" });
    setDraftRestored(false);
    setDraftSavedAt(null);
    setDraftSaving(false);
    toast.success(t("bc.mobile.moment.draft.discarded"));
  }

  /** Lưu nháp ngay lập tức trên máy (không gửi lên máy chủ). */
  function saveDraftNow() {
    if (isDraftEmpty(currentDraft)) {
      // Không có gì để lưu — nói thật thay vì báo thành công giả.
      clearMomentDraft(personId);
      setDraftSavedAt(null);
      setDraftRestored(false);
      toast.error(t("bc.mobile.moment.draft.empty"));
      return;
    }
    writeMomentDraft(personId, currentDraft);
    setDraftSavedAt(Date.now());
    setDraftRestored(false);
    setDraftSaving(false);
    toast.success(t("bc.mobile.moment.draft.savedManual"), {
      description: photos.length > 0 ? t("bc.mobile.moment.draft.photosNotKept") : undefined,
    });
  }

  // Preview lightbox + per-photo replacement target (local UI state only).
  const [previewId, setPreviewId] = useState<string | null>(null);
  // A11y: giữ tiêu điểm trong lớp xem ảnh và trả lại nơi đã mở khi đóng.
  const previewDialogRef = useRef<HTMLDivElement | null>(null);
  const previewOpenerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (previewId) {
      previewOpenerRef.current = document.activeElement as HTMLElement | null;
      previewDialogRef.current?.focus();
      return;
    }
    previewOpenerRef.current?.focus();
    previewOpenerRef.current = null;
  }, [previewId]);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const replaceTargetRef = useRef<string | null>(null);
  // Crop step: id of the photo currently being reframed (local UI state only).
  const [cropId, setCropId] = useState<string | null>(null);
  // Xác nhận trước khi xoá ảnh khỏi lưới, tránh thao tác nhầm.
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  // Camera permission flow: idle → requesting → granted | denied | unsupported | error.
  const [cameraState, setCameraState] = useState<
    "idle" | "requesting" | "granted" | "denied" | "unsupported" | "error"
  >("idle");
  const cameraDenied = cameraState === "denied";
  const cameraNoticeKey: TKey | null =
    cameraState === "requesting"
      ? "bc.mobile.moment.photos.camera.prompt"
      : cameraState === "denied"
        ? "bc.mobile.moment.photos.camera.denied"
        : cameraState === "unsupported"
          ? "bc.mobile.moment.photos.camera.unsupported"
          : cameraState === "error"
            ? "bc.mobile.moment.photos.camera.error"
            : null;

  async function openCamera() {
    if (saving || photos.length >= MOMENT_MAX_PHOTOS) return;
    setCameraState("requesting");
    const { state } = await requestCameraPermission();
    setCameraState(state);
    // "unsupported" still allows the OS capture sheet in some in-app browsers.
    if (state === "granted" || state === "unsupported") {
      cameraInputRef.current?.click();
    }
  }

  // Revoke every preview object URL on unmount.
  const photosRef = useRef<PhotoDraft[]>([]);
  photosRef.current = photos;
  useEffect(
    () => () => {
      for (const p of photosRef.current) {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      }
    },
    [],
  );

  async function addPhotos(files: FileList | null) {
    if (!files || saving) return;
    const capacity = MOMENT_MAX_PHOTOS - photos.length;
    if (capacity <= 0) return;
    const selected = Array.from(files).slice(0, capacity);
    setProcessing({ done: 0, total: selected.length });
    try {
      for (const [index, file] of selected.entries()) {
        setProcessing({ done: index, total: selected.length });
        const result = await processMomentImage(file);
        setPhotos((prev) => {
          if (prev.length >= MOMENT_MAX_PHOTOS) return prev;
          if (!result.ok) {
            return [
              ...prev,
              {
                id: safeRandomUUID(),
                blob: null,
                previewUrl: null,
                errorKey:
                  result.error === "unsupported_type"
                    ? ("bc.mobile.moment.photos.error.unsupported" as const)
                    : result.error === "too_large"
                      ? ("bc.mobile.moment.photos.error.tooLarge" as const)
                      : ("bc.mobile.moment.photos.error.decode" as const),
              },
            ];
          }
          return [
            ...prev,
            {
              id: safeRandomUUID(),
              blob: result.image.blob,
              previewUrl: URL.createObjectURL(result.image.blob),
              errorKey: null,
            },
          ];
        });
        setProcessing({ done: index + 1, total: selected.length });
      }
    } finally {
      setProcessing(null);
    }
  }

  /** Swap one already-chosen photo for a newly picked file, in place. */
  async function replacePhoto(id: string, files: FileList | null) {
    const file = files?.[0];
    if (!file || saving) return;
    setProcessing({ done: 0, total: 1 });
    const result = await processMomentImage(file).finally(() => setProcessing(null));
    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
        if (!result.ok) {
          return {
            ...p,
            blob: null,
            previewUrl: null,
            errorKey:
              result.error === "unsupported_type"
                ? ("bc.mobile.moment.photos.error.unsupported" as const)
                : result.error === "too_large"
                  ? ("bc.mobile.moment.photos.error.tooLarge" as const)
                  : ("bc.mobile.moment.photos.error.decode" as const),
          };
        }
        return {
          ...p,
          blob: result.image.blob,
          previewUrl: URL.createObjectURL(result.image.blob),
          errorKey: null,
        };
      }),
    );
  }

  // Photos captured on the "connected" success screen are consumed once here.
  const stagedRef = useRef(false);
  useEffect(() => {
    if (stagedRef.current) return;
    stagedRef.current = true;
    const files = takeStagedMomentPhotos();
    if (files.length > 0) {
      const list = new DataTransfer();
      for (const f of files) list.items.add(f);
      void addPhotos(list.files);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyCrop(id: string, blob: Blob) {
    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
        return { ...p, blob, previewUrl: URL.createObjectURL(blob), errorKey: null };
      }),
    );
    setCropId(null);
  }

  function requestRemovePhoto(id: string) {
    setConfirmRemoveId(id);
  }

  function removePhoto(id: string) {
    setConfirmRemoveId((cur) => (cur === id ? null : cur));
    setPreviewId((cur) => (cur === id ? null : cur));
    setCropId((cur) => (cur === id ? null : cur));
    setPhotos((prev) => {
      const hit = prev.find((p) => p.id === id);
      if (hit?.previewUrl) URL.revokeObjectURL(hit.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  async function finish(momentId: string) {
    savedRef.current = true;
    // Nhắc nhở chỉ được tạo khi khoảnh khắc đã tồn tại thật trên máy chủ.
    if (reminder.enabled && reminder.atLocal) {
      try {
        const res = await bcMobileMomentReminderCreateFn({
          data: {
            momentId,
            remindAt: new Date(reminder.atLocal).toISOString(),
            label: reminder.label.trim() || null,
          },
        });
        if (!res.ok) toast.error(t(`bc.mobile.moment.reminder.error.${res.error}` as TKey));
      } catch {
        toast.error(t("bc.mobile.moment.reminder.error.unavailable"));
      }
    }
    // Đã lưu thật lên máy chủ → nháp không còn cần thiết.
    clearMomentDraft(personId);
    setDraftSavedAt(null);
    setDraftRestored(false);
    const savedPhotoCount = photos.filter((p) => p.blob != null).length;
    toast.success(t("bc.mobile.moment.savedToast"), {
      description:
        savedPhotoCount > 0
          ? t("bc.mobile.moment.savedToast.withPhotos", { count: savedPhotoCount })
          : t("bc.mobile.moment.savedBanner"),
    });
    queryClient.invalidateQueries({ queryKey: ["bc-mobile", "person-journey"] });
    // BC-Mobile-6A — a new moment is a fresh interaction: refresh suggestions.
    queryClient.invalidateQueries({ queryKey: ["bc-mobile", "rel-intel"] });
    if (personId === "general") {
      await navigate({ to: "/connect-app" });
    } else {
      await navigate({
        to: "/connect-app/network/$personId",
        params: { personId },
        search: { momentSaved: true },
      });
    }
  }

  async function save() {
    if (saving) return;
    setErrorKey(null);

    const occurredDate = new Date(occurredLocal);
    if (
      Number.isNaN(occurredDate.getTime()) ||
      occurredDate.getTime() > Date.now() + MOMENT_OCCURRED_FUTURE_SKEW_MS
    ) {
      setErrorKey("bc.mobile.moment.error.occurredAt");
      return;
    }
    const validPhotos = photos.filter((p) => p.blob != null);

    setSaving(true);
    try {
      const payload = {
        personId,
        occurredAt: occurredDate.toISOString(),
        eventName: eventName.trim() || null,
        placeLabel: placeLabel.trim() || null,
        note: note.trim() || null,
        photoCount: validPhotos.length,
        visibility,
        clientToken: clientTokenRef.current,
      };

      let prep: any;
      try {
        prep = await fetchNestApi<any>("/connect-app/moment/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } catch {
        prep = await bcMobileMomentPrepareFn({ data: payload });
      }

      if (!prep || !prep.ok) {
        setErrorKey(ERROR_KEY_BY_CODE[prep?.error] ?? "bc.mobile.moment.error.generic");
        setSaving(false);
        return;
      }
      if (prep.alreadySaved) {
        // Idempotent replay of a completed save — treat as success.
        await finish(prep.momentId);
        return;
      }

      // Upload to MinIO instead of Supabase
      const mediaPaths: Record<string, string> = {};
      if (prep.photos && prep.photos.length > 0) setUploading({ done: 0, total: prep.photos.length });
      await mapWithConcurrency(prep.photos || [], 2, async (slot: any, i: number) => {
        const blob = validPhotos[i]!.blob!;
        const minioPath = await uploadFileToNest(blob, `${slot.mediaId}.jpg`);
        mediaPaths[slot.mediaId] = minioPath;
        setUploading((prev) =>
          prev ? { done: Math.min(prev.done + 1, prev.total), total: prev.total } : prev,
        );
      });
      setUploading(null);

      const finalizeData = {
        momentId: prep.momentId,
        uploadedMediaIds: (prep.photos || []).map((s: any) => s.mediaId),
        mediaPaths,
      };

      let fin: any;
      try {
        fin = await fetchNestApi<any>(`/connect-app/moment/${prep.momentId}/finalize`, {
          method: "POST",
          body: JSON.stringify({
            uploadedMediaIds: finalizeData.uploadedMediaIds,
            mediaPaths: finalizeData.mediaPaths,
          }),
        });
      } catch {
        fin = await bcMobileMomentFinalizeFn({ data: finalizeData });
      }

      if (!fin || !fin.ok) {
        setErrorKey(
          fin?.error === "unavailable"
            ? "bc.mobile.moment.error.upload"
            : (ERROR_KEY_BY_CODE[fin?.error] ?? "bc.mobile.moment.error.generic"),
        );
        setSaving(false);
        return;
      }
      await finish(prep.momentId);
    } catch {
      // Upload or transport failure — everything stays in place for retry.
      setUploading(null);
      setErrorKey("bc.mobile.moment.error.upload");
      setSaving(false);
    }
  }

  const failedPhotoCount = photos.filter((p) => p.blob == null).length;
  const previewPhoto = photos.find((p) => p.id === previewId) ?? null;
  const cropPhoto = photos.find((p) => p.id === cropId) ?? null;
  const rel = person.person?.relationship;
  const connectedAtRaw =
    rel && rel.kind === "connected" ? (rel.connectedAt ?? null) : null;
  const connectedSince = connectedAtRaw
    ? new Intl.DateTimeFormat(undefined, { month: "2-digit", year: "numeric" }).format(
        new Date(connectedAtRaw),
      )
    : null;
  const rowClass =
    "flex items-center gap-3.5 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-3.5";
  const iconWrapClass =
    "grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] ring-1 ring-[var(--bc-mobile-border-gold)]";
  const clearBtnClass =
    "grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--bc-mobile-muted)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] disabled:opacity-50";
  const fieldClass =
    "w-full bg-transparent p-0 text-[15.5px] font-semibold text-[var(--bc-mobile-text)] outline-none placeholder:font-normal placeholder:text-[var(--bc-mobile-muted)] focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)]";
  const labelClass = "block text-[12.5px] text-[var(--bc-mobile-muted)]";

  return (
    <MobilePage>
      {/* Thanh đầu màn: quay lại · tiêu đề hai dòng · nút Lưu vàng. */}
      <header
        className="sticky top-0 z-50 -mx-5 flex items-center gap-2 border-b border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-bg)]/95 backdrop-blur-md px-3 pb-3"
        style={{ paddingTop: "calc(var(--bc-mobile-safe-top-compact) + 8px)" }}
      >
        <button
          type="button"
          onClick={() =>
            personId === "general"
              ? navigate({ to: "/connect-app/moment" })
              : navigate({ to: "/connect-app/network/$personId", params: { personId } })
          }
          aria-label={t("bc.mobile.moment.composer.back")}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)]"
        >
          <ChevronLeft aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate text-[18px] font-semibold tracking-tight text-[var(--bc-mobile-text)]">
            {t("bc.mobile.moment.composer.title")}
          </h1>
          <p className="mt-0.5 truncate text-[12.5px] text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.moment.composer.tagline")}
          </p>
        </div>
        <button
          type="button"
          form="bc-mobile-moment-form"
          onClick={() => void save()}
          disabled={saving || (personId !== "general" && person.status !== "ok")}
          className="inline-flex h-10 min-w-[72px] shrink-0 items-center justify-center rounded-xl bc-cta-gold px-4 text-[14px] font-semibold active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] disabled:opacity-60"
        >
          {saving ? (
            <Loader2
              aria-hidden="true"
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
              strokeWidth={1.8}
            />
          ) : (
            t("bc.mobile.moment.saveShort")
          )}
        </button>
      </header>

      {draftSavedAt != null || draftSaving ? (
        <div
          aria-live="polite"
          className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[var(--bc-mobile-surface-2)] px-3 py-2 ring-1 ring-[var(--bc-mobile-border-gold)]"
        >
          <div className="min-w-0">
            <p className="text-[12.5px] text-[var(--bc-mobile-muted)]">
              {draftSaving
                ? t("bc.mobile.moment.draft.saving")
                : draftSavedAt == null
                  ? t("bc.mobile.moment.draft.keptOnLeave")
                  : draftRestored
                ? t("bc.mobile.moment.draft.restored")
                : t("bc.mobile.moment.draft.savedAt", {
                    time: new Date(draftSavedAt).toLocaleTimeString(lang === "en" ? "en-US" : "vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  })}
            </p>
            {draftRestored && !draftSaving ? (
              <p className="mt-0.5 text-[11.5px] text-[var(--bc-mobile-muted)]">
                {t("bc.mobile.moment.draft.photosNotKept")}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={discardDraft}
            disabled={saving}
            className="shrink-0 rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-[var(--bc-mobile-accent)] transition-colors hover:bg-[var(--bc-mobile-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] disabled:opacity-50"
          >
            {t("bc.mobile.moment.draft.discard")}
          </button>
        </div>
      ) : null}
      {personId !== "general" && person.status === "loading" ? (
        <div aria-busy="true" className="mt-10 space-y-4">
          <span className="sr-only">{t("bc.mobile.person.loading")}</span>
          <div
            aria-hidden="true"
            className="h-6 w-40 animate-pulse rounded-md bg-[var(--bc-mobile-surface-2)] motion-reduce:animate-none"
          />
          <div
            aria-hidden="true"
            className="h-4 w-56 animate-pulse rounded-md bg-[var(--bc-mobile-surface-2)] motion-reduce:animate-none"
          />
          <div
            aria-hidden="true"
            className="h-12 w-full animate-pulse rounded-2xl bg-[var(--bc-mobile-surface-2)] motion-reduce:animate-none"
          />
        </div>
      ) : personId !== "general" && (person.status === "unavailable" || !person.person) ? (
        <section className="mt-20 flex flex-col items-center px-2 text-center">
          <span
            aria-hidden="true"
            className="grid h-14 w-14 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-muted)]"
          >
            <UserRound className="h-6 w-6" strokeWidth={1.6} />
          </span>
          <h1 className="mt-5 text-[16px] font-medium text-[var(--bc-mobile-text)]">
            {t("bc.mobile.moment.error.relationship")}
          </h1>
          <p className="mx-auto mt-2 max-w-[32ch] text-[14px] leading-relaxed text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.person.unavailable.body")}
          </p>
        </section>
      ) : personId !== "general" && person.status === "error" ? (
        <section className="mt-20 flex flex-col items-center px-2 text-center">
          <h1 className="text-[16px] font-medium text-[var(--bc-mobile-text)]">
            {t("bc.mobile.person.error.title")}
          </h1>
          <button
            type="button"
            onClick={person.retry}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--bc-mobile-border)] px-5 text-[14px] text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            {t("bc.mobile.moment.retry")}
          </button>
        </section>
      ) : (
        <main id="bc-mobile-moment-composer" className="mt-4">
          {personId === "general" ? (
            <div className="flex w-full items-center gap-3.5 rounded-2xl border border-[var(--bc-mobile-border-gold)] bg-gradient-to-r from-[var(--bc-mobile-surface)] to-[var(--bc-mobile-surface-2)] p-3.5 text-left shadow-sm">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-[#D8B282] to-[#F6E1C3] text-slate-950 shadow-md">
                <Sparkles className="h-7 w-7" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[17px] font-bold text-[var(--bc-mobile-text)]">
                  Khoảnh Khắc Doanh Nghiệp & Cá Nhân
                </span>
                <span className="mt-0.5 block truncate text-[13px] text-[var(--bc-mobile-text-2)]">
                  Lưu trữ sự kiện, bài học quản trị, kỷ niệm gặp gỡ
                </span>
                <span className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[var(--bc-mobile-accent)] font-semibold">
                  ✓ Tự do lưu trữ không bắt buộc kết nối
                </span>
              </span>
            </div>
          ) : (
            /* Người liên hệ — thẻ tóm tắt, chạm để mở hồ sơ. */
            <button
              type="button"
              onClick={() =>
                void navigate({ to: "/connect-app/network/$personId", params: { personId } })
              }
              aria-label={t("bc.mobile.moment.person.open")}
              className="flex w-full items-center gap-3.5 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)]"
            >
              {person.person?.avatarUrl ? (
                <img
                  src={person.person.avatarUrl}
                  alt=""
                  loading="lazy"
                  className="h-14 w-14 shrink-0 rounded-full object-cover ring-1 ring-[var(--bc-mobile-border-gold)]"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[16px] font-semibold text-[var(--bc-mobile-accent)] ring-1 ring-[var(--bc-mobile-border-gold)]"
                >
                  {(person.person?.displayName ?? "?").trim().charAt(0).toUpperCase()}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[17px] font-semibold text-[var(--bc-mobile-text)]">
                  {person.person?.displayName ?? t("bc.mobile.network.unknownPerson")}
                </span>
                {(person.person?.headline || person.person?.companyName) && (
                  <span className="mt-0.5 block truncate text-[13.5px] text-[var(--bc-mobile-text-2)]">
                    {[person.person?.headline, person.person?.companyName]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                )}
                <span className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-[var(--bc-mobile-muted)]">
                  <UserRound aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
                  {connectedSince
                    ? t("bc.mobile.moment.person.connectedSince", { date: connectedSince })
                    : t("bc.mobile.moment.person.viewProfile")}
                </span>
              </span>
              <ChevronRight
                aria-hidden="true"
                className="h-5 w-5 shrink-0 text-[var(--bc-mobile-muted)]"
                strokeWidth={1.8}
              />
            </button>
          )}

          {/* Privacy Selector — 3 chế độ: Công khai, Bạn bè, Chỉ mình tôi */}
          <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-2">
            <span className="text-[12px] font-semibold text-[var(--bc-mobile-text-2)] pl-1">Quyền xem:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setVisibility("public")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  visibility === "public"
                    ? "bg-[#D8B282]/20 border border-[#D8B282] text-[#F6E1C3]"
                    : "bg-[var(--bc-mobile-surface)] border border-transparent text-[var(--bc-mobile-muted)]"
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
                    ? "bg-[#D8B282]/20 border border-[#D8B282] text-[#F6E1C3]"
                    : "bg-[var(--bc-mobile-surface)] border border-transparent text-[var(--bc-mobile-muted)]"
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
                    ? "bg-[#D8B282]/20 border border-[#D8B282] text-[#F6E1C3]"
                    : "bg-[var(--bc-mobile-surface)] border border-transparent text-[var(--bc-mobile-muted)]"
                }`}
              >
                <Lock className="h-3 w-3 text-rose-400" />
                <span>Chỉ mình tôi</span>
              </button>
            </div>
          </div>

          <form
            id="bc-mobile-moment-form"
            className="mt-4 space-y-3"

            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <div className={rowClass}>
              <span aria-hidden="true" className={`${iconWrapClass} text-[var(--bc-mobile-accent)]`}>
                <CalendarDays className="h-5 w-5" strokeWidth={1.7} />
              </span>
              <div className="min-w-0 flex-1">
                <label htmlFor="bc-moment-time" className={labelClass}>
                  {t("bc.mobile.moment.field.occurredAt")}
                </label>
                <input
                  id="bc-moment-time"
                  type="datetime-local"
                  value={occurredLocal}
                  max={toLocalInputValue(new Date())}
                  onChange={(e) => setOccurredLocal(e.target.value)}
                  disabled={saving}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className={rowClass}>
              <span aria-hidden="true" className={`${iconWrapClass} text-[var(--bc-mobile-accent)]`}>
                <Users className="h-5 w-5" strokeWidth={1.7} />
              </span>
              <div className="min-w-0 flex-1">
                <label htmlFor="bc-moment-title" className={labelClass}>
                  {t("bc.mobile.moment.field.eventName")}
                </label>
                <input
                  id="bc-moment-title"
                  type="text"
                  value={eventName}
                  maxLength={MOMENT_MAX_EVENT_NAME_LEN}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder={t("bc.mobile.moment.field.eventName.placeholder")}
                  disabled={saving}
                  className={fieldClass}
                />
              </div>
              {eventName ? (
                <button
                  type="button"
                  onClick={() => setEventName("")}
                  disabled={saving}
                  aria-label={t("bc.mobile.moment.field.clear")}
                  className={clearBtnClass}
                >
                  <X aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                </button>
              ) : null}
            </div>

            <div className={rowClass}>
              <span aria-hidden="true" className={`${iconWrapClass} text-[var(--bc-mobile-accent)]`}>
                <MapPin className="h-5 w-5" strokeWidth={1.7} />
              </span>
              <div className="min-w-0 flex-1">
                <label htmlFor="bc-moment-place" className={labelClass}>
                  {t("bc.mobile.moment.field.place")}
                </label>
                <input
                  id="bc-moment-place"
                  type="text"
                  value={placeLabel}
                  maxLength={MOMENT_MAX_PLACE_LABEL_LEN}
                  onChange={(e) => setPlaceLabel(e.target.value)}
                  placeholder={t("bc.mobile.moment.field.place.placeholder")}
                  disabled={saving}
                  className={fieldClass}
                />
              </div>
              {placeLabel ? (
                <button
                  type="button"
                  onClick={() => setPlaceLabel("")}
                  disabled={saving}
                  aria-label={t("bc.mobile.moment.field.clear")}
                  className={clearBtnClass}
                >
                  <X aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                </button>
              ) : null}
            </div>

            {/* Phạm vi chia sẻ khoảnh khắc */}
            <section className="rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-accent)] ring-1 ring-[var(--bc-mobile-border-gold)]">
                    {visibility === "public" ? <Globe className="h-4.5 w-4.5" strokeWidth={1.8} /> : visibility === "private" ? <Lock className="h-4.5 w-4.5" strokeWidth={1.8} /> : <Users className="h-4.5 w-4.5" strokeWidth={1.8} />}
                  </span>
                  <div>
                    <span className="block text-[13.5px] font-semibold text-[var(--bc-mobile-text)]">
                      Phạm vi hiển thị
                    </span>
                    <span className="block text-[11.5px] text-[var(--bc-mobile-muted)]">
                      {visibility === "public"
                        ? "Công khai — Mọi người đều thấy được trên mạng lưới"
                        : visibility === "private"
                          ? "Riêng tư — Chỉ 1 mình tôi xem được"
                          : "Bạn bè — Chỉ những người đã kết bạn mới xem được"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setVisibility("friends")}
                  className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                    visibility === "friends"
                      ? "border-[var(--bc-mobile-border-gold,#D8B282)] bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-text)] ring-1 ring-[var(--bc-mobile-border-gold)] font-bold shadow-xs"
                      : "border-[var(--bc-mobile-border)] bg-transparent text-[var(--bc-mobile-muted)] hover:bg-[var(--bc-mobile-surface-2)] font-medium"
                  }`}
                >
                  <Users className={`h-4.5 w-4.5 ${visibility === "friends" ? "text-[var(--bc-mobile-accent)]" : ""}`} />
                  <span className="text-[12px] leading-tight">Bạn bè</span>
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setVisibility("public")}
                  className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                    visibility === "public"
                      ? "border-[var(--bc-mobile-border-gold,#D8B282)] bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-text)] ring-1 ring-[var(--bc-mobile-border-gold)] font-bold shadow-xs"
                      : "border-[var(--bc-mobile-border)] bg-transparent text-[var(--bc-mobile-muted)] hover:bg-[var(--bc-mobile-surface-2)] font-medium"
                  }`}
                >
                  <Globe className={`h-4.5 w-4.5 ${visibility === "public" ? "text-[var(--bc-mobile-accent)]" : ""}`} />
                  <span className="text-[12px] leading-tight">Công khai</span>
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setVisibility("private")}
                  className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                    visibility === "private"
                      ? "border-[var(--bc-mobile-border-gold,#D8B282)] bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-text)] ring-1 ring-[var(--bc-mobile-border-gold)] font-bold shadow-xs"
                      : "border-[var(--bc-mobile-border)] bg-transparent text-[var(--bc-mobile-muted)] hover:bg-[var(--bc-mobile-surface-2)] font-medium"
                  }`}
                >
                  <Lock className={`h-4.5 w-4.5 ${visibility === "private" ? "text-[var(--bc-mobile-accent)]" : ""}`} />
                  <span className="text-[12px] leading-tight">1 mình tôi</span>
                </button>
              </div>
            </section>


            <section
              aria-labelledby="bc-moment-photos-label"
              className="rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-3.5"
            >
              <div className="flex items-center justify-between gap-3">
                <span id="bc-moment-photos-label" className="text-[13.5px] font-semibold text-[var(--bc-mobile-text)]">
                  {t("bc.mobile.moment.photos.title")}
                </span>
                <span
                  className="text-[12.5px] tabular-nums text-[var(--bc-mobile-muted)]"
                  aria-live="polite"
                  aria-label={t("bc.mobile.moment.photos.count", {
                    selected: String(photos.length),
                    max: String(MOMENT_MAX_PHOTOS),
                  })}
                >
                  {t("bc.mobile.moment.photos.countShort", {
                    selected: String(photos.length),
                    max: String(MOMENT_MAX_PHOTOS),
                  })}
                </span>

              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={MOMENT_IMAGE_ACCEPT}
                multiple
                disabled={saving || photos.length >= MOMENT_MAX_PHOTOS}
                onChange={(e) => {
                  void addPhotos(e.target.files);
                  e.target.value = "";
                }}
                className="sr-only"
                aria-labelledby="bc-moment-photos-label"
              />
              <input
                ref={replaceInputRef}
                type="file"
                accept={MOMENT_IMAGE_ACCEPT}
                disabled={saving}
                onChange={(e) => {
                  const id = replaceTargetRef.current;
                  if (id) void replacePhoto(id, e.target.files);
                  replaceTargetRef.current = null;
                  e.target.value = "";
                }}
                className="sr-only"
                aria-labelledby="bc-moment-photos-label"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept={MOMENT_IMAGE_ACCEPT}
                capture="environment"
                multiple
                disabled={saving || photos.length >= MOMENT_MAX_PHOTOS}
                onChange={(e) => {
                  void addPhotos(e.target.files);
                  e.target.value = "";
                }}
                className="sr-only"
                aria-labelledby="bc-moment-photos-label"
              />

              <ul className="-mx-1 mt-3 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {photos.map((p, i) => (
                  <li key={p.id} className="relative w-[112px] shrink-0 snap-start">
                    {p.previewUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreviewId(p.id)}
                        aria-label={`${t("bc.mobile.moment.photos.preview")} ${i + 1}`}
                        className="block w-full overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)]"
                      >
                        <img
                          src={p.previewUrl}
                          alt={`${t("bc.mobile.moment.photos.title")} ${i + 1}`}
                          className="aspect-[4/5] w-full rounded-xl border border-[var(--bc-mobile-border)] object-cover"
                        />
                      </button>
                    ) : (
                      <span
                        role={p.errorKey ? "alert" : undefined}
                        className="grid aspect-[4/5] w-full place-items-center gap-1.5 rounded-xl border border-dashed border-destructive/60 bg-destructive/10 px-1.5 py-2 text-center text-[11px] leading-tight text-[var(--bc-mobile-text-2)]"
                      >
                        <AlertTriangle
                          aria-hidden="true"
                          className="h-4 w-4 text-destructive"
                          strokeWidth={1.8}
                        />
                        <span className="font-semibold text-destructive">
                          {t("bc.mobile.moment.photos.errorBadge")}
                        </span>
                        {p.errorKey ? <span>{t(p.errorKey)}</span> : null}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => requestRemovePhoto(p.id)}
                      disabled={saving}
                      aria-label={`${t("bc.mobile.moment.photos.remove")} ${i + 1}`}
                      className="absolute right-1.5 top-1.5 grid h-9 w-9 place-items-center rounded-full bg-[var(--bc-mobile-navy)]/85 text-[var(--bc-mobile-ivory)] shadow-sm transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)]"
                    >
                      <X aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        replaceTargetRef.current = p.id;
                        replaceInputRef.current?.click();
                      }}
                      disabled={saving}
                      aria-label={`${t("bc.mobile.moment.photos.replace")} ${i + 1}`}
                      className="absolute bottom-1.5 right-1.5 grid h-9 w-9 place-items-center rounded-full bg-[var(--bc-mobile-navy)]/85 text-[var(--bc-mobile-ivory)] shadow-sm transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)]"
                    >
                      <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  </li>
                ))}

                {processing ? (
                  <li className="w-[112px] shrink-0">
                    <span className="grid aspect-[4/5] w-full place-items-center gap-2 rounded-xl border border-dashed border-[var(--bc-mobile-border-gold)] bg-[var(--bc-mobile-surface-2)] px-2 text-center text-[11px] leading-tight text-[var(--bc-mobile-muted)]">
                      <Loader2
                        aria-hidden="true"
                        className="h-4 w-4 animate-spin text-[var(--bc-mobile-accent)] motion-reduce:animate-none"
                        strokeWidth={1.8}
                      />
                      {t("bc.mobile.moment.photos.processing", {
                        done: Math.min(processing.done + 1, processing.total),
                        total: processing.total,
                      })}
                    </span>
                  </li>
                ) : null}


                {photos.length < MOMENT_MAX_PHOTOS ? (
                  <>
                    <li className="w-[112px] shrink-0">
                      <button
                        type="button"
                        onClick={() => void openCamera()}
                        disabled={saving || cameraState === "requesting"}
                        className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--bc-mobile-border-gold)] bg-[var(--bc-mobile-surface-2)] px-2 text-center text-[12px] text-[var(--bc-mobile-text-2)] transition-colors active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] disabled:opacity-50"
                      >
                        <Camera
                          aria-hidden="true"
                          className="h-5 w-5 text-[var(--bc-mobile-accent)]"
                          strokeWidth={1.7}
                        />
                        {cameraState === "requesting"
                          ? t("bc.mobile.moment.photos.camera.requesting")
                          : cameraDenied
                            ? t("bc.mobile.moment.photos.camera.retry")
                            : t("bc.mobile.moment.photos.camera")}
                      </button>
                    </li>
                    <li className="w-[112px] shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={saving}
                        className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-2 text-center text-[12px] text-[var(--bc-mobile-text-2)] transition-colors active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] disabled:opacity-50"
                      >
                        <ImagePlus
                          aria-hidden="true"
                          className="h-5 w-5 text-[var(--bc-mobile-accent)]"
                          strokeWidth={1.7}
                        />
                        {t("bc.mobile.moment.photos.library")}
                      </button>
                    </li>
                  </>
                ) : null}
              </ul>

              <p aria-live="polite" className="sr-only">
                {processing
                  ? t("bc.mobile.moment.photos.processing", {
                      done: Math.min(processing.done + 1, processing.total),
                      total: processing.total,
                    })
                  : uploading
                    ? t("bc.mobile.moment.photos.uploading", {
                        done: Math.min(uploading.done + 1, uploading.total),
                        total: uploading.total,
                      })
                    : ""}
              </p>

              {uploading ? (
                <div className="mt-3 space-y-1.5">
                  <p className="text-[12.5px] text-[var(--bc-mobile-text-2)]">
                    {t("bc.mobile.moment.photos.uploading", {
                      done: Math.min(uploading.done + 1, uploading.total),
                      total: uploading.total,
                    })}
                  </p>
                  <div
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={uploading.total}
                    aria-valuenow={uploading.done}
                    className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bc-mobile-surface-2)]"
                  >
                    <span
                      className="block h-full rounded-full bg-[var(--bc-mobile-accent)] transition-[width] duration-300"
                      style={{
                        width: `${Math.round((uploading.done / Math.max(uploading.total, 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ) : null}

              {failedPhotoCount > 0 ? (
                <p
                  role="alert"
                  className="mt-2 flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-[12.5px] leading-relaxed text-destructive"
                >
                  <AlertTriangle
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0"
                    strokeWidth={1.8}
                  />
                  {t("bc.mobile.moment.photos.errorSummary", { count: failedPhotoCount })}
                </p>
              ) : null}


              {photos.length >= MOMENT_MAX_PHOTOS ? (
                <p className="mt-2 text-[12.5px] text-[var(--bc-mobile-muted)]">
                  {t("bc.mobile.moment.photos.full")}
                </p>
              ) : null}
              {cameraNoticeKey ? (
                <p
                  role={cameraDenied ? "alert" : "status"}
                  className="mt-2 rounded-xl bg-[var(--bc-mobile-surface-2)] px-3 py-2 text-[12.5px] leading-relaxed text-[var(--bc-mobile-text-2)]"
                >
                  {t(cameraNoticeKey)}
                </p>
              ) : null}
            </section>

            <MomentReminderPicker value={reminder} onChange={setReminder} disabled={saving} />

            <MomentVoiceNote
              disabled={saving}
              canUndo={noteBeforeVoice !== null}
              onApply={(voiceNote) => {
                setNoteBeforeVoice(note);
                const merged = note.trim() ? `${note.trim()}\n\n${voiceNote}` : voiceNote;
                setNote(merged.slice(0, MOMENT_MAX_NOTE_LEN));
              }}
              onUndo={() => {
                setNote(noteBeforeVoice ?? "");
                setNoteBeforeVoice(null);
              }}
            />

            <section className="flex items-start gap-3.5 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-3.5">
              <span aria-hidden="true" className={`${iconWrapClass} text-[var(--bc-mobile-accent)]`}>
                <NotebookPen className="h-5 w-5" strokeWidth={1.7} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="bc-moment-note" className={labelClass}>
                    {t("bc.mobile.moment.field.note")}
                  </label>
                  <span
                    id="bc-moment-note-count"
                    aria-live="polite"
                    className="shrink-0 text-[12px] tabular-nums text-[var(--bc-mobile-muted)]"
                  >
                    {note.length}/{MOMENT_MAX_NOTE_LEN}
                  </span>
                </div>
                <textarea
                  id="bc-moment-note"
                  value={note}
                  maxLength={MOMENT_MAX_NOTE_LEN}
                  rows={3}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("bc.mobile.moment.field.note.placeholder")}
                  disabled={saving}
                  aria-describedby="bc-moment-note-count"
                  className="mt-1 w-full resize-none rounded-lg bg-transparent p-0 text-[15px] leading-relaxed text-[var(--bc-mobile-text)] outline-none placeholder:text-[var(--bc-mobile-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)]"
                />
              </div>
            </section>

            {errorKey ? (
              <p role="alert" className="text-[13.5px] text-[#b91c1c]">
                {t(errorKey)}
              </p>
            ) : null}

            {/* Hàng hành động cuối màn — lưu nháp cục bộ / lưu thật lên máy chủ. */}
            <div className="mt-1 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={saveDraftNow}
                disabled={saving}
                className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--bc-mobile-border-gold)] bg-[var(--bc-mobile-surface)] text-[15px] font-semibold text-[var(--bc-mobile-accent)] transition-colors active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] disabled:opacity-60"
              >
                <BookmarkIcon aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                {t("bc.mobile.moment.draft.saveNow")}
              </button>
              <button
                type="submit"
                disabled={saving}
                aria-disabled={saving}
                className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bc-cta-gold text-[15px] font-semibold active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] disabled:opacity-60 motion-reduce:transition-none"
              >
                {saving ? (
                  <Loader2
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin motion-reduce:animate-none"
                    strokeWidth={1.8}
                  />
                ) : (
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                )}
                {saving ? t("bc.mobile.moment.submit.saving") : t("bc.mobile.moment.submit")}
              </button>
            </div>


            {/* A11y: trạng thái lưu được đọc bởi trình đọc màn hình. */}
            <p role="status" aria-live="polite" className="sr-only">
              {saving ? t("bc.mobile.moment.submit.saving") : ""}
            </p>

          </form>
        </main>
      )}

      {/* Full-size preview of one selected photo — dialog semantics, Escape closes. */}
      {previewPhoto?.previewUrl ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("bc.mobile.moment.photos.previewTitle")}
          tabIndex={-1}
          ref={previewDialogRef}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              setPreviewId(null);
              return;
            }
            if (e.key !== "Tab") return;
            const root = previewDialogRef.current;
            if (!root) return;
            const items = Array.from(
              root.querySelectorAll<HTMLElement>("button:not([disabled])"),
            );
            if (items.length === 0) return;
            const first = items[0]!;
            const last = items[items.length - 1]!;
            const active = document.activeElement;
            if (e.shiftKey && (active === first || active === root)) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && active === last) {
              e.preventDefault();
              first.focus();
            }
          }}
          className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4 outline-none"
        >
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setPreviewId(null)}
              aria-label={t("bc.mobile.moment.photos.previewClose")}
              className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
          <button
            type="button"
            aria-label={t("bc.mobile.moment.photos.previewClose")}
            onClick={() => setPreviewId(null)}
            className="flex flex-1 items-center justify-center"
          >
            <img
              src={previewPhoto.previewUrl}
              alt={t("bc.mobile.moment.photos.previewTitle")}
              className="max-h-full max-w-full rounded-2xl object-contain"
            />
          </button>
          <div className="flex justify-center gap-2 pb-2">
            <button
              type="button"
              onClick={() => setCropId(previewPhoto.id)}
              disabled={saving}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-5 text-[14px] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
            >
              <CropIcon aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              {t("bc.mobile.moment.photos.crop")}
            </button>
            <button
              type="button"
              onClick={() => {
                replaceTargetRef.current = previewPhoto.id;
                replaceInputRef.current?.click();
              }}
              disabled={saving}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-5 text-[14px] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              {t("bc.mobile.moment.photos.replace")}
            </button>
            <button
              type="button"
              onClick={() => requestRemovePhoto(previewPhoto.id)}
              disabled={saving}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-5 text-[14px] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
            >
              <X aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              {t("bc.mobile.moment.photos.remove")}
            </button>
          </div>
        </div>
      ) : null}

      {/* Crop step — reframe one photo before saving the moment. */}
      {cropPhoto?.previewUrl && cropPhoto.blob ? (
        <MomentPhotoCropper
          src={cropPhoto.previewUrl}
          blob={cropPhoto.blob}
          onCancel={() => setCropId(null)}
          onApply={(blob) => applyCrop(cropPhoto.id, blob)}
        />
      ) : null}

      {/* Hỏi lại trước khi xoá một ảnh khỏi lưới 4:5. */}
      <AlertDialog
        open={confirmRemoveId != null}
        onOpenChange={(next) => {
          if (!next) setConfirmRemoveId(null);
        }}
      >
        <AlertDialogContent data-testid="bc-moment-photo-remove-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bc.mobile.moment.photos.removeConfirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bc.mobile.moment.photos.removeConfirm.body")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("bc.mobile.moment.photos.removeConfirm.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="bc-moment-photo-remove-submit"
              onClick={(e) => {
                e.preventDefault();
                if (confirmRemoveId) removePhoto(confirmRemoveId);
                setConfirmRemoveId(null);
              }}
            >
              {t("bc.mobile.moment.photos.removeConfirm.submit")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobilePage>
  );
}
